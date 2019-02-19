(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzResizableTableColumn', igzResizableTableColumn);

    function igzResizableTableColumn($document, $rootScope, $timeout, $window, lodash) {
        return {
            restrict: 'A',
            replace: true,
            scope: {
                colClass: '@'
            },
            template: '<div class="resize-block" data-ng-mousedown="$ctrl.onMouseDown($event)" data-ng-click="$ctrl.onClick($event)" data-ng-dblclick="$ctrl.onDoubleClick($event)"></div>',
            controller: IgzResizeTableController,
            controllerAs: '$ctrl',
            link: link,
            bindToController: true
        };

        function link(scope, element) {
            var parent = element.parent();
            var timeout = null;
            onInit();

            /**
             * Constructor method
             */
            function onInit() {
                scope.$on('$destroy', onDestroy);
                parent
                    .on('mouseenter', onMouseEnter)
                    .on('mouseleave', onMouseLeave);
            }

            /**
             * Destructor method
             */
            function onDestroy() {
                $timeout.cancel(timeout);
                parent
                    .off('mouseenter', onMouseEnter)
                    .off('mouseleave', onMouseLeave);
            }

            function onMouseEnter() {
                timeout = $timeout(function () {
                    element.addClass('hover');
                }, 250);
            }

            function onMouseLeave() {
                $timeout.cancel(timeout);
                element.removeClass('hover');
            }
        }

        function IgzResizeTableController($element, $scope) {
            var ctrl = this;

            ctrl.minWidth = 100;
            ctrl.startPosition = 0;

            ctrl.onMouseDown = onMouseDown;
            ctrl.onClick = onClick;
            ctrl.onDoubleClick = onDoubleClick;

            onInit();

            //
            // Public methods
            //

            /**
             * Prevents click propagation
             * @param {Object} event
             */
            function onClick(event) {
                event.stopPropagation();
            }

            /**
             * Prevents click propagation
             * @param {Object} event
             */
            function onDoubleClick(event) {

                // set min width for selected column
                if (ctrl.columnHeadMinWidth < ctrl.columnHeadWidth) {
                    var colDifference = ctrl.columnHeadMinWidth - ctrl.columnHeadWidth;
                    resizeColumn(colDifference);
                }

                // set width of the column to fit the content
                $rootScope.$broadcast('autofit-col', {colClass: ctrl.colClass, callbackFunction: resizeColumn});
            }

            /**
             * On mouse down handler
             * @param {Object} event
             */
            function onMouseDown(event) {

                // prevent default dragging of selected content
                event.preventDefault();
                event.stopPropagation();

                // saves start position of resize
                ctrl.startPosition = event.clientX;

                // adds event listeners
                $document.on('mousemove', onMouseMove);
                $document.on('mouseup', onMouseUp);

                return false;
            }

            //
            // Private methods
            //

            /**
             * Constructor
             */
            function onInit() {

                // set header widths of the resizing columns
                $timeout(initColumnsWidths);

                angular.element($window).on('resize', reloadColumns);
                $scope.$on('reload-columns', reloadColumns);
                $scope.$on('$destroy', destructor);
            }

            /**
             * Destructor method
             */
            function destructor() {
                angular.element($window).off('resize', reloadColumns);
            }

            /**
             * On mouse move handler
             * @param {Object} event
             */
            function onMouseMove(event) {
                var colDifference = event.clientX - ctrl.startPosition;
                ctrl.startPosition = event.clientX;
                resetColumnsWidths();
                resizeColumn(colDifference);

                $rootScope.$broadcast('multiline-ellipsis_refresh');
            }

            /**
             * On mouse up handlers
             * @param {Object} event
             */
            function onMouseUp(event) {

                // detaches even listeners
                $document.off('mousemove', onMouseMove);
                $document.off('mouseup', onMouseUp);

                // prevent default dragging of selected content
                event.preventDefault();
                event.stopPropagation();

                $rootScope.$broadcast('resize-tags-cells');
            }

            /**
             * Reloads column cells in the table according to column width
             */
            function reloadColumns() {
                if (!lodash.isNil(ctrl.nextBlock)) {
                    $timeout(function () {
                        resetColumnsWidths();

                        $rootScope.$broadcast('resize-cells', {
                            colClass: ctrl.colClass,
                            columnWidth: ctrl.columnHeadWidth + 'px',
                            nextColumnWidth: ctrl.nextBlockWidth + 'px'
                        });
                    });
                }
            }

            /**
             * Initialises columns and their min width
             */
            function initColumnsWidths() {

                // get block which will be resized
                ctrl.columnHead = $element[0].parentElement;
                ctrl.columnHeadMinWidth = ctrl.minWidth;
                if (ctrl.columnHead.offsetWidth > 0) {
                    ctrl.columnHeadMinWidth = lodash.min([ctrl.columnHead.offsetWidth, ctrl.minWidth]);
                }

                // get parent container of the header
                ctrl.parentBlock = ctrl.columnHead.parentElement;

                // get block which is next to resizing block
                ctrl.nextBlock = ctrl.columnHead.nextElementSibling;
                ctrl.nextBlockMinWidth = ctrl.minWidth;
                if (!lodash.isNil(ctrl.nextBlock) && ctrl.nextBlock.offsetWidth > 0) {
                    ctrl.nextBlockMinWidth = lodash.min([ctrl.nextBlock.offsetWidth, ctrl.minWidth]);
                }
                resetColumnsWidths();
            }

            /**
             * Resets columns widths
             */
            function resetColumnsWidths() {
                ctrl.columnHeadWidth = ctrl.columnHead.offsetWidth;
                ctrl.parentBlockWidth = ctrl.parentBlock.offsetWidth;
                if (!lodash.isNil(ctrl.nextBlock)) {
                    ctrl.nextBlockWidth = ctrl.nextBlock.offsetWidth;
                }
            }

            /**
             * Resize cells in the table rows according to column width
             * @param {Object} colDifference - information about column difference
             */
            function resizeColumn(colDifference) {
                if (!lodash.isNil(ctrl.nextBlock)) {

                    // calculate new width for the block which need to be resized
                    var maxColumnHeadDifference = ctrl.columnHeadWidth - ctrl.columnHeadMinWidth;

                    // calculate new width for the  block which is next to resizing block
                    var maxNextBlockDifference = ctrl.nextBlockWidth - ctrl.nextBlockMinWidth;

                    // calculate maximum resizing value of columns
                    var newDifference = 0;
                    if (colDifference > 0 && maxNextBlockDifference > 0) {
                        newDifference = lodash.min([colDifference, maxNextBlockDifference]);
                    } else if (colDifference < 0 && maxColumnHeadDifference > 0) {
                        newDifference = lodash.max([colDifference, -maxColumnHeadDifference]);
                    }

                    if (newDifference !== 0) {
                        ctrl.columnHeadWidth = ctrl.columnHeadWidth + newDifference;
                        ctrl.nextBlockWidth = ctrl.nextBlockWidth - newDifference;

                        setElementWidth(ctrl.columnHead, ctrl.columnHeadWidth);
                        setElementWidth(ctrl.nextBlock, ctrl.nextBlockWidth);

                        $rootScope.$broadcast('resize-cells', {
                            colClass: ctrl.colClass,
                            columnWidth: ctrl.columnHeadWidth + 'px',
                            nextColumnWidth: ctrl.nextBlockWidth + 'px'
                        });
                        $rootScope.$broadcast('resize-size-cells');
                    }
                }
            }

            /**
             * Sets header element width in percentage
             * @param {Object} element - element object
             * @param {number} widthInPixels - new width value
             */
            function setElementWidth(element, widthInPixels) {
                element.style.width = (widthInPixels / ctrl.parentBlockWidth * 100) + '%';
            }
        }
    }

}());
