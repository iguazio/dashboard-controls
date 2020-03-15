/* eslint complexity: ["error", 14] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzSize', {
            bindings: {
                entity: '<',
                type: '@'
            },
            templateUrl: 'igz_controls/components/size/size.tpl.html',
            controller: IgzSizeController
        });

    function IgzSizeController($filter, $scope, $i18next, $timeout, i18next, lodash, moment, ConfigService,
                               PaletteService) {
        var ctrl = this;
        var lng = i18next.language;

        var TOOLTIP_ARROW_SIZE = 7;
        var tooltipByType = {
            container: $i18next.t('common:TOOLTIP.LAST_MONTH', {lng: lng}),
            service: $i18next.t('common:TOOLTIP.LAST_HOUR', {lng: lng}),
            function: $i18next.t('common:TOOLTIP.LAST_HOUR', {lng: lng}),
            storage_pool: $i18next.t('common:TOOLTIP.LAST_MONTH', {lng: lng}),
            cluster: $i18next.t('common:TOOLTIP.LAST_10_MINUTES', {lng: lng}),
            node: $i18next.t('common:TOOLTIP.LAST_10_MINUTES', {lng: lng}),
            tenant: $i18next.t('common:TOOLTIP.LAST_MONTH', {lng: lng})
        };

        var CPU_TYPES = ['nodes', 'clusters'];
        var CPU_CORES_TYPES = ['services_cpu', 'functions_cpu'];
        var SIZE_TYPES = ['containers', 'storage-pools', 'tenants', 'services_memory', 'functions_memory'];
        var COUNT_TYPES = ['functions_events'];

        ctrl.outOf = '';

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.getDisplayValue = getDisplayValue;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.chartObjName = ctrl.type + '-chartObj';
            ctrl.tooltip = tooltipByType[ctrl.entity.type];

            if (lodash.startsWith(ctrl.type, 'services')) {
                ctrl.tooltip = tooltipByType['service'];
            } else if (lodash.startsWith(ctrl.type, 'functions')) {
                ctrl.tooltip = tooltipByType['function'];
            }

            prepareData(ctrl.type);

            ctrl.metricType = isCpu()      ? 'cpuLineChartData'      :
                              isCpuCores() ? 'cpuCoresLineChartData' :
                              isSize()     ? 'sizeLineChartData'     :
                                             'countLineChartData'    ;

            ctrl.displayValueWithTooltip = lodash.includes(['containers', 'tenants'], ctrl.type);
            ctrl.justDisplayValue = lodash.includes(['clusters', 'nodes', 'functions_cpu', 'functions_memory',
                'functions_events', 'services_cpu', 'services_memory'], ctrl.type);

            ctrl.displayValueClasses = {
                'short': lodash.includes(['functions_memory'], ctrl.type),
                'shorten': lodash.includes(['functions_events'], ctrl.type),
                'shortest': lodash.includes(['clusters', 'nodes', 'services_cpu', 'functions_cpu'], ctrl.type)
            };

            lodash.defaults(ctrl.entity.ui, {
                lineChartOptions: {}
            });

            ctrl.entity.ui.lineChartOptions[ctrl.type] = {
                options: {
                    chart: {
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        style: {
                            overflow: 'visible'
                        },
                        spacing: [0, 0, 0, 0],
                        type: 'areaspline'
                    },
                    title: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        lineWidth: 0,
                        labels: {
                            enabled: false
                        },
                        title: {
                            text: null
                        },
                        type: 'datetime',
                        startOnTick: false,
                        endOnTick: false,
                        tickPositions: []
                    },
                    yAxis: {
                        min: 0,
                        endOnTick: false,
                        startOnTick: false,
                        labels: {
                            enabled: false
                        },
                        title: {
                            text: null
                        },
                        tickPositions: []
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            animation: false,
                            color: PaletteService.sizeChartPlotOptionsSeriesColor,
                            fillColor: {
                                linearGradient: { x1: 0, y1: -1, x2: 0, y2: 1},
                                stops: [
                                    [0, PaletteService.sizeChartPlotOptionsSeriesFillColorOne],
                                    [1, PaletteService.sizeChartPlotOptionsSeriesFillColorTwo]
                                ]
                            },
                            lineWidth: 2,
                            marker: {
                                enabled: false,
                                states: {
                                    hover: {
                                        enabled: false
                                    }
                                }
                            },
                            shadow: false,
                            states: {
                                hover: {
                                    lineWidth: 2
                                }
                            }
                        },
                        column: {
                            negativeColor: PaletteService.sizeChartPlotOptionsColumnNegativeColor,
                            borderColor: 'silver'
                        }
                    },
                    navigation: {
                        buttonOptions: {
                            enabled: false
                        }
                    }
                },
                title: {
                    text: ''
                },
                loading: false,
                useHighStocks: false,
                func: function (chart) {
                    ctrl.entity.ui[ctrl.chartObjName] = chart;
                }
            };

            ctrl.entity.ui.lineChartOptions[ctrl.type].series = [{
                data: ctrl.entity.ui.metrics[ctrl.metricType],
                name: 'Volume (GB)'
            }];

            if (ctrl.type === 'storage-pools') {
                ctrl.entity.ui.lineChartOptions[ctrl.type].options.tooltip = {
                    backgroundColor: 'none',
                    borderWidth: 0,
                    enabled: true,
                    hideDelay: 0,
                    shadow: false,
                    shared: true,
                    style: {
                        padding: 0
                    },
                    useHTML: true,
                    positioner: function (tooltipWidth, tooltipHeight, point) {
                        var sizeContainerPosition = this.chart.container.getClientRects()[0];
                        var left = point.plotX - tooltipWidth / 2 + sizeContainerPosition.left;
                        var top = point.plotY - tooltipHeight + sizeContainerPosition.top - TOOLTIP_ARROW_SIZE;

                        return { x: left, y: top };
                    },
                    formatter: function () {
                        var sizePercentage = '';
                        if (lodash.isNumber(ctrl.entity.attr.usable_capacity)) {
                            sizePercentage = Math.floor(100 * this.y / ctrl.entity.attr.usable_capacity);
                            sizePercentage = '(' + (sizePercentage < 1 ? '~0' : sizePercentage) + '%)';
                        }
                        return '<div class="igz-tooltip-wrapper">' +
                            '<div class="igz-row">' +
                            '<div class="tooltip-label igz-col-40">' +
                            $i18next.t('common:TOTAL', {lng: lng}) + '</div>' +
                            '<div class="tooltip-value igz-col-60">' + $filter('bytes')(ctrl.entity.attr.usable_capacity, 2) + '</div>' +
                            '</div>' +
                            '<div class="igz-row">' +
                            '<div class="tooltip-label igz-col-40">' +
                            $i18next.t('common:USED', {lng: lng}) + '</div>' +
                            '<div class="tooltip-value igz-col-60">' +
                            '<span>' + $filter('bytes')(this.y, 1) + '</span>' +
                            '&nbsp;<span class="tooltip-value-highlighted">' + sizePercentage + '</span>' +
                            '</div>' +
                            '</div>' +
                            '<div class="igz-row">' +
                            '<div class="tooltip-label igz-col-40">' +
                            $i18next.t('common:FREE', {lng: lng}) + '</div>' +
                            '<div class="tooltip-value igz-col-60">' + $filter('bytes')(ctrl.entity.attr.usable_capacity - this.y, 2) + '</div>' +
                            '</div>' +
                            '</div><div class="igz-tooltip-arrow-down"></div>';
                    }
                };

                $scope.$on('size_hide-tooltip', hideChartTooltip);
            }

            if (isCpu()) {
                ctrl.entity.ui.lineChartOptions[ctrl.type].options.tooltip = {
                    backgroundColor: 'none',
                    borderWidth: 0,
                    enabled: true,
                    hideDelay: 0,
                    shadow: false,
                    shared: true,
                    style: {
                        padding: 0
                    },
                    useHTML: true,
                    positioner: function (tooltipWidth, tooltipHeight, point) {
                        var sizeContainerPosition = this.chart.container.getClientRects()[0];
                        var left = point.plotX - tooltipWidth / 2 + sizeContainerPosition.left;
                        var top = point.plotY - tooltipHeight + sizeContainerPosition.top - TOOLTIP_ARROW_SIZE;

                        return { x: left, y: top };
                    },
                    formatter: function () {
                        var formattedDate = moment(this.points[0].key).format('DD MMM, YYYY, hh:mm:ss A');

                        return '<div class="igz-tooltip-wrapper">' +
                            '<div class="tooltip-header">' + formattedDate + '</div>' +
                            '<div class="igz-row">' +
                            '<div class="tooltip-label igz-col-40">' +
                            $i18next.t('common:CPU_USED', {lng: lng}) + '</div>' +
                            '<div class="tooltip-value igz-col-60">' + this.y.toFixed(1) + '%</div>' +
                            '</div>' +
                            '</div>' +
                            '<div class="igz-tooltip-arrow-down"></div>';
                    }
                };

                $scope.$on('size_hide-tooltip', hideChartTooltip);
            } else if (isTooltipEnabled()) {
                ctrl.entity.ui.lineChartOptions[ctrl.type].options.tooltip = {
                    backgroundColor: 'none',
                    borderWidth: 0,
                    enabled: true,
                    hideDelay: 0,
                    shadow: false,
                    shared: true,
                    style: {
                        padding: 0
                    },
                    useHTML: true,
                    positioner: function (tooltipWidth, tooltipHeight, point) {
                        var sizeContainerPosition = this.chart.container.getClientRects()[0];
                        var left = point.plotX - tooltipWidth / 2 + sizeContainerPosition.left;
                        var top = point.plotY - tooltipHeight + sizeContainerPosition.top - TOOLTIP_ARROW_SIZE;

                        return { x: left, y: top };
                    },
                    formatter: function () {
                        var formattedDate = moment(this.points[0].key).format('DD MMM, YYYY, hh:mm:ss A');
                        var tooltipValue = isCount()    ? $filter('scale')(this.y)             :
                                           isCpuCores() ? $filter('scale')(this.y, 0, 'nanos') :
                                                          $filter('bytes')(this.y, 2);
                        var label = isCount() ? $i18next.t('common:VALUE', {lng: lng}) :
                                                $i18next.t('common:USED', {lng: lng});

                        return '<div class="igz-tooltip-wrapper used-capacity-tooltip-wrapper">' +
                            '<div class="tooltip-header">' + formattedDate + '</div>' +
                            '<div class="igz-row">' +
                            '<div class="tooltip-label igz-col-30">' + label + '</div>' +
                            '<div class="tooltip-value igz-col-70">' + tooltipValue + '</div>' +
                            '</div>' +
                            '</div>' +
                            '<div class="igz-tooltip-arrow-down"></div>';
                    }
                };

                $scope.$on('size_hide-tooltip', hideChartTooltip);
            }

            if (ctrl.type === 'storage-pools_containers' && angular.isDefined(ctrl.entity.attr.quota) &&
                ctrl.entity.attr.quota !== 0 && isMaxQuotaValueAppropriate()) {

                ctrl.entity.ui.lineChartOptions[ctrl.type].options.yAxis.plotLines = [{
                    color: PaletteService.sizeChartLineChartOptionsYAxisPlotLinesColor,
                    width: 1,
                    value: ctrl.entity.attr.quota,
                    zIndex: 5
                }];

                ctrl.entity.ui.lineChartOptions[ctrl.type].options.yAxis.max = ctrl.entity.attr.quota;
            }

            if (isCpu()) {
                ctrl.entity.ui.lineChartOptions[ctrl.type].options.yAxis.max = 100;
            }

            $scope.$on('size_update-charts', updateChart);
            $scope.$on('info-page-pane_toggled', updateChart);
            $scope.$on('resize-size-cells', updateChart);

            $timeout(updateChart);
        }

        //
        // Public methods
        //

        /**
         * Gets display value
         * @returns {string}
         */
        function getDisplayValue() {
            var defaultValue = isCpu()  ? '0%'      :
                               isSize() ? '0 bytes' :
                                          '0';
            var metricName = isCpu()      ? 'cpu.idle'  :
                             isCpuCores() ? 'cpu.cores' :
                             isSize()     ? 'size'      :
                                            'count';
            var value = ctrl.entity.ui.metrics[metricName];
            var sizePercentage = ctrl.entity.ui.metrics.sizePercentage;
            sizePercentage = lodash.isUndefined(sizePercentage) ? '' : ' (' + sizePercentage + '%)';

            return lodash.isNil(value) ? defaultValue :
                   isCpu()      ? $filter('number')(value > 0 ? 100 - value : 0, 0) + '%' :
                   isCpuCores() ? $filter('scale')(value, 0, 'nanos')                     :
                   isSize()     ? $filter('bytes')(value, 2) + sizePercentage             :
                                  $filter('scale')(value);
        }

        //
        // Private methods
        //

        /**
         * Hides chart tooltip
         */
        function hideChartTooltip() {
            if (!ctrl.entity.ui[ctrl.chartObjName].tooltip.isHidden) {
                ctrl.entity.ui[ctrl.chartObjName].tooltip.hide();
            }
        }

        /**
         * Determines whether this chart is for Count
         * @returns {boolean} `true` if this chart is for Count or `false` otherwise
         */
        function isCount() {
            return lodash.includes(COUNT_TYPES, ctrl.type);
        }

        /**
         * Determines whether this chart is for CPU
         * @returns {boolean} `true` if this chart is for CPU or `false` otherwise
         */
        function isCpu() {
            return lodash.includes(CPU_TYPES, ctrl.type);
        }

        /**
         * Determines whether this chart is for CPU cores
         * @returns {boolean} `true` if this chart is for CPU cores or `false` otherwise
         */
        function isCpuCores() {
            return lodash.includes(CPU_CORES_TYPES, ctrl.type);
        }

        /**
         * Defines if max quota value and max point in chart data has difference less than 20%
         * @returns {boolean}
         */
        function isMaxQuotaValueAppropriate() {
            var maxGraphicPoint = lodash.maxBy(lodash.values(ctrl.entity.ui.metrics.sizeLineChartData), function (point) {
                return point[1];
            });

            return (ctrl.entity.attr.quota - maxGraphicPoint[1]) / ctrl.entity.attr.quota * 100 <= 20;
        }

        /**
         * Determines whether this chart is for Size
         * @returns {boolean} `true` if this chart is for Size or `false` otherwise
         */
        function isSize() {
            return lodash.includes(SIZE_TYPES, ctrl.type);
        }

        /**
         * Checks if chart should have a tooltip
         * @returns {boolean}
         */
        function isTooltipEnabled() {
            return lodash.includes(['containers', 'storage-pools', 'tenants', 'services_memory', 'services_cpu',
                'functions_memory', 'functions_cpu', 'functions_events'], ctrl.type);
        }

        /**
         * Initializes data according to passed page type
         * @param {string} type - page type
         */
        function prepareData(type) {
            var dataTypes = {
                'clusters': prepareCpuData,
                'containers': prepareSizeData,
                'nodes': prepareCpuData,
                'functions_cpu': prepareCpuCoresData,
                'functions_memory': prepareSizeData,
                'functions_events': prepareCountData,
                'services_cpu': prepareCpuData,
                'services_memory': prepareSizeData,
                'storage-pools': prepareStoragePoolsData,
                'storage-pools_containers': prepareStoragePoolsContainersData,
                'tenants': prepareSizeData
            };

            dataTypes[type]();

            function prepareCpuData() {
                lodash.defaults(ctrl.entity.ui.metrics, {'cpu.idle': 0});
            }

            function prepareCpuCoresData() {
                lodash.defaults(ctrl.entity.ui.metrics, {'cpu.cores': 0});
            }

            function prepareSizeData() {
                lodash.defaults(ctrl.entity.ui.metrics, {size: 0});
            }

            function prepareCountData() {
                lodash.defaults(ctrl.entity.ui.metrics, {count: 0});
            }

            function prepareStoragePoolsData() {
                lodash.defaults(ctrl.entity.ui.metrics, {size: 0});
                updateOutOf();
            }

            function prepareStoragePoolsContainersData() {
                lodash.defaults(ctrl.entity.ui.metrics, {size: 0});

                ctrl.reserved = angular.isDefined(ctrl.entity.attr.reserved) ? $filter('bytes')(ctrl.entity.attr.reserved, 2) : 0;
                ctrl.quota = angular.isDefined(ctrl.entity.attr.quota) ? $filter('bytes')(ctrl.entity.attr.quota, 2) : -1;
            }
        }

        /**
         * Updates chart on broadcasted event
         */
        function updateChart() {
            var reflow = lodash.get(ctrl.entity.ui, ctrl.chartObjName + '.reflow');
            if (angular.isFunction(reflow)) {
                ctrl.entity.ui[ctrl.chartObjName].reflow();
            }
        }

        function updateOutOf() {
            var usableCapacity = ctrl.entity.attr.usable_capacity;
            ctrl.outOf = lodash.isNil(usableCapacity) ? '-' : $filter('bytes')(usableCapacity, 2);
        }
    }
}());
