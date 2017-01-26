((angular, smi2, AmCharts, $) => {
    'use strict';

    angular.module(smi2.app.name).controller('FooterCtrl', FooterController);
    FooterController.$inject = [
        '$scope',
        '$rootScope',
        '$window',
        'localStorageService',
        'API',
        '$mdSidenav',
        '$mdDialog',
        '$mdToast',
        'ThemeService'
    ];

    /**
     * @ngdoc controller
     * @name smi2.controller:FooterCtrl
     * @description SQL controller data
     */
    function FooterController($scope,
                           $rootScope,
                           $window,
                           localStorageService,
                           API,
                           $mdSidenav,
                           $mdDialog,
                           $mdToast,
                              ThemeService) {


        $scope.amChartOptions = false;


        $scope.ready = {
            pivot:false,
            amchart:false,
            echarts:false

        };
        $scope.echarts = {
            sankeys:false
        };



        $scope.vars = {
            rsw: 0,
            uiTheme: ThemeService.themeObject,
            isChartReady:false,
            stackType:'false'

        };

        $scope.initPivot = (meta,data) => {
            console.info('pivot');
            console.table(meta);

            let rows=[];
            let cols=[];
            angular.element("#pivotDiv").pivotUI(data, {
                dataClass: $.pivotUtilities.SubtotalPivotData,
                rows: rows,
                cols: cols,
                renderer: $.pivotUtilities.subtotal_renderers["Table With Subtotal"],
                rendererOptions: {
                    collapseRowsAt: 1,
                    collapseColsAt: 0
                }
            });
            $scope.ready.pivot=true;
        };

        $scope.initSankeys = (meta,data,query) => {

            let drawCommand=[];
            if ('drawCommand' in query)
            {
                drawCommand=query.drawCommand;
            }
            let levels=[];
            drawCommand.forEach(i => {
                try {
                    if (i && !i.code) return;
                    let object=eval('('+i.code+')');
                    console.warn(object);
                    levels=object['levels'];

                    // получаем настройки по осям
                } catch (E) {
                    console.error('error eval ', i.code);
                }
            });


            // подготовка данных
            let nodes=[];
            let links=[];
            console.warn('levels',levels);
            levels.forEach(level=>{
                if (level.source && level.target && level.value) {

                    data.forEach(row=>{
                        nodes[row[level.source]]=1;
                        nodes[row[level.target]]=1;

                        links.push({
                            source:row[level.source],
                            target:row[level.target],
                            value:row[level.value]
                        })

                    });
                }
            });
            let result_nodes=[];
            for (let key in nodes) {
                   result_nodes.push({name:key});
            }
            let option = {
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove'

                },
                series: [
                    {
                        type: 'sankey',
                        layout:'none',
                        data: result_nodes,
                        links: links,
                        itemStyle: {
                            normal: {
                                borderWidth: 1,
                                borderColor: '#aaa'
                            }
                        },
                        lineStyle: {
                            normal: {
                                curveness: 0.5
                            }
                        }
                    }
                ]
            };

            //
            //
            console.info(option);
            // let dom = document.getElementById('sunkeyDiv');
            // let myChart = echarts.init(dom);

            $scope.echarts.sankeys=option;
            // myChart.setOption(option);
            //
            // $.get('./product.json', function (data) {
            //
            //
            //
            // });
            $scope.ready.echarts=true;

        };
        $scope.initChart = (meta,data,query) => {
            let drawCommand=[];
            if ('drawCommand' in query)
            {
                drawCommand=query.drawCommand;
            }
            $scope.createChart(meta,data,drawCommand);
            $scope.ready.amchart=true;
        };

        $scope.getChartGraph = (meta,chartSets) => {

            // SELECT number,sin(number),cos(number),number as `Title [asix=g2:column:blue]`  from system.numbers limit 40
                let showname=meta.name;
                let name=meta.name;
                let useaxis="v1";

                showname=showname.replace(/_axis\d+/gm,'');
                // showname=showname.replace(/_column\d+/gm,'');

                var re=/.*_axis(\d+).*/i;
                var axis = name.match(re);


                if (axis && axis[1])
                {
                    useaxis='v'+axis[1];
                }
                let f= {
                    "id": "g1",
                    "valueAxis": useaxis,
                    "fillAlphas": 0.2,
                    "bullet": "round",
                    "bulletSize": 8,
                    "hideBulletsCount": 50,
                    "lineThickness": 1,
                    "title": showname,
                    "useLineColorForBulletBorder": true,
                    "valueField": name,
                    "type": "smoothedLine",
                    "balloonText": "[[title]] [[category]]<br><b><span style='font-size:14px;'>[[value]]</span></b>"
                };

                if (!chartSets) chartSets={};

                return Object.assign(f,chartSets);
        };


        $scope.createChart= (meta,data,drawCommand)=> {

            // ['DROP', 'CREATE', 'ALTER'].indexOf(  item.query.keyword.toUpperCase()  ) != -1

            let chartSets={};
            drawCommand.forEach(i => {
                try {
                    if (i && !i.code) return;
                    let object=eval('('+i.code+')');
                    console.warn(object);

                    // получаем настройки по осям
                    meta.forEach((i) => {
                        // получаем ключь для каждой оси
                        if (object[i.name])
                        {
                            chartSets[i.name]=object[i.name];
                        }
                    });
                } catch (E) {
                    console.error('error eval ', i.code);
                }
            });





            let dataDateFormat=false;
            let categoryField="";
            let minPeriod='mm';//minute
            let graphs=[];
            let counter=0;
            let axes=[];
            meta.forEach((i) => {

                if (i.type=='DateTime') {
                    dataDateFormat="YYYY-MM-DD JJ:NN:SS";
                    categoryField=i.name;
                }else {
                    if (i.type=='Date') {
                        dataDateFormat="YYYY-MM-DD";
                        minPeriod='DD';
                        categoryField=i.name;
                    }
                    else {
                        if (!categoryField)
                        {
                            categoryField=i.name;
                            return;
                        }
                        counter=counter+1;
                        let g=$scope.getChartGraph(i,chartSets[i.name]);
                        g.id='g'+counter;


                        if (g.valueAxis!=='v1')
                        {
                            axes.push(g.valueAxis);
                        }
                        graphs.push(g);

                    }

                }


            });



            let theme='light';
            if (ThemeService.isDark()) {
                theme='dark';
            }
            //this all works:
            let obl={
                "color": ThemeService.isDark() ? '#eee' : '#333',
                "type": "serial",
                "theme": theme,
                "marginRight": 50,
                "marginLeft": 50,
                "startDuration": 0.4,
                // "handDrawn":true,
                "autoMarginOffset": 50,
                "autoResize":true,
                "marginBottom": 30,
                "marginsUpdated": true,
                "marginTop": 10,

                "categoryField": categoryField,

                "valueAxes": [ {
                    "id": "v1",
                    "axisAlpha": 1,
                    // "stackType": "100%",// "stackType": "regular",
                    "gridAlpha": 0.07,
                    "axisColor": ThemeService.isDark() ? '#eee' : '#333',
                    "gridColor": ThemeService.isDark() ? '#eee' : '#333',
                    // "axisThickness": 2,
                    // "position": "left",
                    "ignoreAxisWidth": true
                } ],

                "balloon": {  "borderThickness": 1,  "shadowAlpha": 0
                },

                "graphs": graphs ,
                "chartCursor": {
                    "valueLineEnabled": true,
                    "valueLineBalloonEnabled": true,
                    "cursorAlpha": 0,
                    "zoomable": false,
                    "valueZoomable": true,
                    "valueLineAlpha": 0.5
                },

                // "valueScrollbar": {
                    // "autoGridCount": true,
                    // "color": "#000000",
                    // "scrollbarHeight": 1
                // },

                "chartScrollbar": {
                    "graph":"g1",
                    "gridAlpha":0,
                    "color":"#888888",
                    "scrollbarHeight":25,
                    "backgroundAlpha":0,
                    "selectedBackgroundAlpha":0.1,
                    "selectedBackgroundColor":"#888888",
                    "graphFillAlpha":0,
                    "autoGridCount":true,
                    "selectedGraphFillAlpha":0,
                    "graphLineAlpha":0.2,
                    "graphLineColor":"#c2c2c2",
                    "selectedGraphLineColor":"#888888",
                    "selectedGraphLineAlpha":1
                },
                "categoryAxis": {
                    "dashLength": 1,
                    "minorGridEnabled": true,
                    "axisColor": ThemeService.isDark() ? '#eee' : '#333',
                    "gridColor": ThemeService.isDark() ? '#eee' : '#333'
                },
                "dataProvider": data,
                "legend": {
                    "align": "center",
                    "equalWidths": false,
                    "periodValueText": "total: [[value.sum]]",
                    "valueAlign": "left",
                    "valueText": "[[value]] ([[percents]]%)",
                    "valueWidth": 100
                }
            };


            if (dataDateFormat)
            {
                obl.dataDateFormat=dataDateFormat;
                obl.categoryAxis.parseDates=true;
                obl.categoryAxis.minPeriod=minPeriod;
            }

            if (axes)
            {
                let a_offset=0;
                axes.forEach((a) => {
                    a_offset++;
                    let ax=
                    {
                        "id": a,
                        "axisAlpha": 1,
                        "axisThickness": 1,
                        "position": "right",
                        "ignoreAxisWidth": true,
                        "offset": 1 * a_offset
                    };
                    obl.valueAxes.push(ax);
                });
            }




            console.info('valueAxes',obl.valueAxes);

            AmCharts.makeChart("myFirstChart", obl);
        };

    }
})(angular, smi2, window.AmCharts, window.$);
