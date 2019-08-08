'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls', ['iguazio.dashboard-controls.templates', 'ui.router', 'ui.bootstrap', 'ngFileUpload', 'ngDialog', 'ngSanitize', 'download', 'angular-yamljs', 'jm.i18next', 'angular-i18next']);
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').directive('igzInputBlurOnEnter', igzInputBlurOnEnter);

    function igzInputBlurOnEnter() {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                initInput();

                scope.$on('$destroy', destructor);
            }

            /**
             * Submit Rule name input on Enter key press
             */
            function initInput() {
                element.on('keydown', blurOnEnterKey);
            }

            /**
             * Set element to blur on Enter key press
             * @param {Object} e - event
             */
            function blurOnEnterKey(e) {
                if (e.keyCode === 13) {
                    element.blur();
                }
            }

            /**
             * Destructor method
             */
            function destructor() {
                element.off('keydown', blurOnEnterKey);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    igzInputOnlyValidCharacters.$inject = ['$timeout'];
    angular.module('iguazio.dashboard-controls').directive('igzInputOnlyValidCharacters', igzInputOnlyValidCharacters);

    function igzInputOnlyValidCharacters($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                pattern: '=igzInputOnlyValidCharacters',
                onlyValidCharacters: '=onlyValidCharacters'
            },
            link: link
        };

        function link(scope, element, attr, ngModelCtrl) {
            var REGEXP = scope.pattern;
            var onlyValidCharacters = scope.onlyValidCharacters;
            var lastValidViewValue;

            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                $timeout(function () {
                    lastValidViewValue = ngModelCtrl.$viewValue;
                });

                ngModelCtrl.$parsers.unshift(validation);
            }

            /**
             * Checks whether entered value is valid
             * @param {string} viewValue - entered view value
             * @returns {string} the last valid entered value
             */
            function validation(viewValue) {
                if (onlyValidCharacters) {
                    if (REGEXP.test(viewValue)) {
                        lastValidViewValue = viewValue;
                    } else {

                        // Renders the last valid input in the field
                        ngModelCtrl.$viewValue = lastValidViewValue;
                        ngModelCtrl.$commitViewValue();
                        ngModelCtrl.$render();
                    }
                    return lastValidViewValue;
                } else {
                    return viewValue;
                }
            }
        }
    }
})();
'use strict';

/**
 * Angular directive to truncate multi-line text to visible height
 * @param bind (angular bound value to append) REQUIRED
 * @param ellipsisAppend (string) string to append at end of truncated text after ellipsis, can be HTML OPTIONAL
 * @param ellipsisAppendClick (function) function to call if ellipsisAppend is clicked (ellipsisAppend must be clicked) OPTIONAL
 * @param ellipsisSymbol (string) string to use as ellipsis, replaces default '...' OPTIONAL
 * @param ellipsisSeparator (string) separator to split string, replaces default ' ' OPTIONAL
 *
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData"></p>
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData" data-ellipsis-symbol="---"></p>
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData" data-ellipsis-append="read more"></p>
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData" data-ellipsis-append="read more" data-ellipsis-append-click="displayFull()"></p>
 */
/* eslint complexity: ["error", 25] */
(function () {
    'use strict';

    igzMultilineEllipsis.$inject = ['$sce', '$timeout', '$window'];
    angular.module('iguazio.dashboard-controls').directive('igzMultilineEllipsis', igzMultilineEllipsis);

    function igzMultilineEllipsis($sce, $timeout, $window) {
        return {
            restrict: 'A',
            scope: {
                ngBind: '=',
                ngBindHtml: '=?',
                ellipsisAppend: '@?',
                ellipsisAppendClick: '&?',
                ellipsisSymbol: '@?',
                ellipsisSeparator: '@?',
                ellipsisSeparatorReg: '=?',
                useParent: '@?'
            },
            link: link
        };

        function link(scope, element, attributes) {
            var AsyncDigest = function AsyncDigest(delay) {
                var timeout = null;
                var queue = [];

                this.remove = function (fn) {
                    if (queue.indexOf(fn) !== -1) {
                        queue.splice(queue.indexOf(fn), 1);
                        if (queue.length === 0) {
                            $timeout.cancel(timeout);
                            timeout = null;
                        }
                    }
                };
                this.add = function (fn) {
                    if (queue.indexOf(fn) === -1) {
                        queue.push(fn);
                    }
                    if (!timeout) {
                        timeout = $timeout(function () {
                            var copy = queue.slice();
                            timeout = null;

                            // reset scheduled array first in case one of the functions throws an error
                            queue.length = 0;
                            copy.forEach(function (fnc) {
                                fnc();
                            });
                        }, delay);
                    }
                };
            };

            var asyncDigestImmediate = new AsyncDigest(0);
            var asyncDigestDebounced = new AsyncDigest(75);

            // Window Resize Variables
            attributes.lastWindowResizeTime = 0;
            attributes.lastWindowResizeWidth = 0;
            attributes.lastWindowResizeHeight = 0;
            attributes.lastWindowTimeoutEvent = null;

            //State Variables
            attributes.isTruncated = false;

            var $win = angular.element($window);
            $win.bind('resize', onResize);

            //
            // Private methods
            //

            /**
             * Builds ellipsis
             */
            function buildEllipsis() {
                var binding = scope.ngBind || scope.ngBindHtml;
                var isTrustedHTML = false;
                if ($sce.isEnabled() && angular.isObject(binding) && $sce.getTrustedHtml(binding)) {
                    isTrustedHTML = true;
                    binding = $sce.getTrustedHtml(binding);
                }
                if (binding) {
                    var isHtml = !Boolean(scope.ngBind) && Boolean(scope.ngBindHtml);
                    var i = 0,
                        ellipsisSymbol = angular.isDefined(attributes.ellipsisSymbol) ? attributes.ellipsisSymbol : '&hellip;',
                        ellipsisSeparator = angular.isDefined(scope.ellipsisSeparator) ? attributes.ellipsisSeparator : ' ',
                        ellipsisSeparatorReg = angular.isDefined(scope.ellipsisSeparatorReg) ? scope.ellipsisSeparatorReg : false,
                        appendString = angular.isDefined(scope.ellipsisAppend) && scope.ellipsisAppend !== '' ? ellipsisSymbol + '<span>' + scope.ellipsisAppend + '</span>' : ellipsisSymbol,
                        bindArray = ellipsisSeparatorReg ? binding.match(ellipsisSeparatorReg) : binding.split(ellipsisSeparator);

                    attributes.isTruncated = false;
                    if (isHtml) {
                        element.html(binding);
                    } else {
                        element.text(binding);
                    }

                    // If text has overflow
                    if (isOverflowed(element, scope.useParent)) {
                        var bindArrayStartingLength = bindArray.length,
                            initialMaxHeight = scope.useParent ? getParentHeight(element) : element[0].clientHeight;

                        if (isHtml) {
                            element.html(binding + appendString);
                        } else {
                            element.text(binding).html(element.html() + appendString);
                        }

                        // Set data-overflow on element for targeting
                        element.attr('data-overflowed', 'true');

                        // Set complete text and remove one word at a time, until there is no overflow
                        for (; i < bindArrayStartingLength; i++) {
                            bindArray.pop();

                            if (isHtml) {
                                element.html(bindArray.join(ellipsisSeparator) + appendString);
                            } else {
                                element.text(bindArray.join(ellipsisSeparator)).html(element.html() + appendString);
                            }

                            if ((scope.useParent ? element.parent()[0] : element[0]).scrollHeight < initialMaxHeight || isOverflowed(element, scope.useParent) === false) {
                                attributes.isTruncated = true;
                                break;
                            }
                        }

                        // If append string was passed and append click function included
                        if (ellipsisSymbol !== appendString && angular.isDefined(scope.ellipsisAppendClick) && scope.ellipsisAppendClick !== '') {
                            element.find('span').bind('click', function (e) {
                                scope.$apply(function () {
                                    scope.ellipsisAppendClick.call(scope, {
                                        event: e
                                    });
                                });
                            });
                        }

                        if (!isTrustedHTML && $sce.isEnabled()) {
                            $sce.trustAsHtml(binding);
                        }
                    } else {
                        element.attr('data-overflowed', 'false');
                    }
                }
            }

            /**
             * Checks window's dimensions for rebuilding ellipsis
             */
            function checkWindowForRebuild() {
                if (attributes.lastWindowResizeWidth !== window.innerWidth || attributes.lastWindowResizeHeight !== window.innerHeight) {
                    buildEllipsis();
                }

                attributes.lastWindowResizeWidth = window.innerWidth;
                attributes.lastWindowResizeHeight = window.innerHeight;
            }

            /**
             * Gets parents's height
             * @param {Object} el
             * @returns {number}
             */
            function getParentHeight(el) {
                var heightOfChildren = 0;
                angular.forEach(el.parent().children(), function (child) {
                    if (child !== el[0]) {
                        heightOfChildren += child.clientHeight;
                    }
                });
                return el.parent()[0].clientHeight - heightOfChildren;
            }

            /**
             * Test if element has overflow of text beyond height or max-height
             * @param {Object} thisElement
             * @param {boolean} useParent
             * @returns {boolean}
             */
            function isOverflowed(thisElement, useParent) {
                thisElement = useParent ? thisElement.parent() : thisElement;
                return thisElement[0].scrollHeight > thisElement[0].clientHeight;
            }

            /**
             * When window width or height changes - re-init truncation
             */
            function onResize() {
                asyncDigestDebounced.add(checkWindowForRebuild);
            }

            //
            // Watchers
            //

            /**
             * Execute ellipsis truncate on ngBind update
             */
            scope.$watch('ngBind', function () {
                asyncDigestImmediate.add(buildEllipsis);
            });

            /**
             * Execute ellipsis truncate on ngBindHtml update
             */
            scope.$watch('ngBindHtml', function () {
                asyncDigestImmediate.add(buildEllipsis);
            });

            /**
             * Execute ellipsis truncate on ngBind update
             */
            scope.$watch('ellipsisAppend', function () {
                buildEllipsis();
            });

            /**
             * Execute ellipsis truncate when element becomes visible
             */
            scope.$watch(function () {
                return element[0].offsetWidth !== 0 && element[0].offsetHeight !== 0;
            }, function () {
                asyncDigestDebounced.add(buildEllipsis);
            });

            var unbindRefreshEllipsis = scope.$on('multiline-ellipsis_refresh', function () {
                asyncDigestImmediate.add(buildEllipsis);
            });

            /**
             * Destructor method
             */
            scope.$on('$destroy', function () {
                $win.unbind('resize', onResize);
                asyncDigestImmediate.remove(buildEllipsis);
                asyncDigestDebounced.remove(checkWindowForRebuild);
                if (unbindRefreshEllipsis) {
                    unbindRefreshEllipsis();
                    unbindRefreshEllipsis = null;
                }
            });
        }
    }
})();
'use strict';

/**
 * Directive adds max-height for scrollbar container
 * @param igzNgScrollbarsConfig.maxElementsCount (number) maximum number of children elements that fit into the scrollbar container
 * @param igzNgScrollbarsConfig.childrenSelector (string) selector for children elements
 */
(function () {
    'use strict';

    igzNgScrollbarsConfig.$inject = ['$timeout', 'lodash'];
    angular.module('iguazio.dashboard-controls').directive('igzNgScrollbarsConfig', igzNgScrollbarsConfig);

    function igzNgScrollbarsConfig($timeout, lodash) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attrs) {
            var config = angular.fromJson(attrs.igzNgScrollbarsConfig);

            $timeout(function () {
                activate();
            });
            scope.$watch(function () {
                return element.find(config.childrenSelector).length;
            }, activate);

            /**
             * Constructor method
             */
            function activate() {
                var childrenElements = element.find(config.childrenSelector);
                var maxElementsCount = config.maxElementsCount;
                var scrollbarContainerHeight = 0;

                if (childrenElements.length > maxElementsCount) {
                    scrollbarContainerHeight = lodash.chain(childrenElements).take(maxElementsCount).map(function (child) {
                        var styles = window.getComputedStyle(child);
                        var margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);

                        return child.offsetHeight + margin;
                    }).sum().value();
                }

                element.css({ 'max-height': scrollbarContainerHeight > 0 ? scrollbarContainerHeight : 'unset' });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').directive('igzNgScrollbarsMethods', igzNgScrollbarsMethods);

    function igzNgScrollbarsMethods() {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attr) {
            activate();

            /**
             * Constructor method
             */
            function activate() {
                scope.$on('ng-scrollbars-methods_scroll-to', scrollToTarget);
            }

            /**
             * Scrolls to specified element (selected by id) inside ng-scrollbars container
             * Used in broadcast
             * @param {Object} event - broadcast event
             * @param {Object} data - broadcast data
             */
            function scrollToTarget(event, data) {

                // Check if current directive was demanded
                if (attr.igzNgScrollbarsMethods === data.scrollContainerName) {
                    element.mCustomScrollbar('scrollTo', '#' + data.target);
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    igzResizableRowCells.$inject = ['$rootScope', '$timeout', 'lodash'];
    angular.module('iguazio.dashboard-controls').directive('igzResizableRowCells', igzResizableRowCells);

    function igzResizableRowCells($rootScope, $timeout, lodash) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element) {
            onInit();

            /**
             * Constructor method
             */
            function onInit() {
                scope.$on('resize-cells', resizeCells);
                scope.$on('autofit-col', autoFitColumn);

                $timeout(function () {
                    $rootScope.$broadcast('reload-columns');
                });
            }

            //
            // Private methods
            //

            /**
             * Checks width of cells column auto-fit
             * @param {Object} event - broadcast event
             * @param {Object} data - information about column name
             */
            function autoFitColumn(event, data) {
                var currentCell = element.find('.' + data.colClass)[0];

                if (!lodash.isNil(currentCell)) {
                    var currentWidth = currentCell.offsetWidth;

                    // temporary set auto width to get data for auto-fit
                    currentCell.style.width = 'auto';
                    var newWidth = currentCell.offsetWidth;
                    currentCell.style.width = currentWidth + 'px';

                    if (newWidth > currentWidth) {
                        var colDifference = newWidth - currentWidth + 2;

                        if (angular.isFunction(data.callbackFunction)) {
                            data.callbackFunction(colDifference);
                        }
                    }
                }
            }

            /**
             * Resize cells according to igz-resize-table-column directive move
             * @param {Object} event - broadcast event
             * @param {Object} data - information about column name and size
             */
            function resizeCells(event, data) {

                // search for cell which should be resized
                var currentCell = element.find('.' + data.colClass)[0];
                if (!lodash.isNil(currentCell)) {
                    var nextCell = currentCell.nextElementSibling;

                    // set new value for cells width
                    currentCell.style.width = data.columnWidth;

                    if (!lodash.isNil(nextCell)) {
                        nextCell.style.width = data.nextColumnWidth;
                    }
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    igzResizableTableColumn.$inject = ['$document', '$rootScope', '$timeout', '$window', 'lodash'];
    angular.module('iguazio.dashboard-controls').directive('igzResizableTableColumn', igzResizableTableColumn);

    function igzResizableTableColumn($document, $rootScope, $timeout, $window, lodash) {
        IgzResizeTableController.$inject = ['$element', '$scope'];

        return {
            restrict: 'A',
            replace: true,
            scope: {
                colClass: '@'
            },
            template: '<div class="resize-block" data-ng-mousedown="$ctrl.onMouseDown($event)" data-ng-click="$ctrl.onClick($event)" data-ng-dblclick="$ctrl.onDoubleClick($event)"></div>',
            controller: IgzResizeTableController,
            controllerAs: '$ctrl',
            bindToController: true
        };

        function IgzResizeTableController($element, $scope) {
            var ctrl = this;
            var timeout = null;

            ctrl.minWidth = 100;
            ctrl.startPosition = 0;

            ctrl.onMouseDown = onMouseDown;
            ctrl.onClick = onClick;
            ctrl.onDoubleClick = onDoubleClick;

            onInit();

            //
            // Hook methods
            //

            /**
             * Constructor method
             */
            function onInit() {

                // set header widths of the resizing columns
                $timeout(initColumnsWidths);
                $timeout(initElements);

                angular.element($window).on('resize', reloadColumns);
                $scope.$on('reload-columns', reloadColumns);
                $scope.$on('resizable-table-column_reset-data', resetData);
                $scope.$on('$destroy', onDestroy);
            }

            /**
             * Destructor method
             */
            function onDestroy() {
                $timeout(function () {
                    angular.element($window).off('resize', reloadColumns);
                    ctrl.parentElement.off('mouseenter', onMouseEnter).off('mouseleave', onMouseLeave);
                });
            }

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
                $rootScope.$broadcast('autofit-col', { colClass: ctrl.colClass, callbackFunction: resizeColumn });
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

                // Sets extra classes for correct displaying resizing elements
                ctrl.allElements.addClass('resizing');
                ctrl.prevElement.addClass('active');
                if (ctrl.isNeedBorder) {
                    $element.addClass('active');
                }

                return false;
            }

            /**
             * Reset initial data
             */
            function resetData() {
                ctrl.parentElement.off('mouseenter', onMouseEnter).off('mouseleave', onMouseLeave);

                initColumnsWidths();
                initElements();
            }

            //
            // Private methods
            //

            /**
             * On mouse enter handler
             */
            function onMouseEnter() {
                timeout = $timeout(function () {
                    ctrl.prevElement.addClass('hover');
                    if (ctrl.isNeedBorder) {
                        $element.addClass('hover');
                    }
                }, 250);
            }

            /**
             * On mouse leave handler
             */
            function onMouseLeave() {
                $timeout.cancel(timeout);

                ctrl.prevElement.removeClass('hover');
                if (ctrl.isNeedBorder) {
                    $element.removeClass('hover');
                }
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

                // Removes extra classes
                ctrl.prevElement.removeClass('active');
                ctrl.allElements.removeClass('resizing');
                if (ctrl.isNeedBorder) {
                    $element.removeClass('active');
                }

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
             * Initialises elements and register callbacks for events
             */
            function initElements() {
                ctrl.parentElement = $element.parent();
                ctrl.prevElement = ctrl.parentElement.prev().find('.resize-block');
                ctrl.allElements = ctrl.parentElement.parent().find('.resize-block');

                var lastElement = ctrl.allElements.last()[0];
                var lastColumn = ctrl.parentElement.parent()[0].lastElementChild;
                ctrl.isNeedBorder = lastElement !== $element[0] || lastElement.parentElement !== lastColumn;

                !ctrl.isNeedBorder ? $element.addClass('last') : $element.removeClass('last');

                ctrl.parentElement.on('mouseenter', onMouseEnter).on('mouseleave', onMouseLeave);
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
                element.style.width = widthInPixels / ctrl.parentBlockWidth * 100 + '%';
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /*
     * Watch window resizing event to set new window dimensions,
     * and broadcast the event to the app (use in html tag)
     */

    igzWatchWindowResize.$inject = ['$window', '$timeout', '$rootScope', 'WindowDimensionsService'];
    angular.module('iguazio.dashboard-controls').directive('igzWatchWindowResize', igzWatchWindowResize);

    function igzWatchWindowResize($window, $timeout, $rootScope, WindowDimensionsService) {
        return {
            link: link
        };

        function link() {
            activate();

            function activate() {
                var resizing;

                // On window resize...
                angular.element($window).on('resize', function () {

                    // Reset timeout
                    $timeout.cancel(resizing);
                    WindowDimensionsService.removeOverflow();

                    // Add a timeout to not call the resizing function every pixel
                    resizing = $timeout(function () {
                        getDimensions();
                    }, 300);
                });
            }

            // Get window's dimensions
            function getDimensions() {

                // Namespacing events with name of directive + event to avoid collisions
                // http://stackoverflow.com/questions/23272169/what-is-the-best-way-to-bind-to-a-global-event-in-a-angularjs-directive
                $rootScope.$broadcast('igzWatchWindowResize::resize', {
                    height: WindowDimensionsService.height(),
                    width: WindowDimensionsService.width()
                });
            }
        }
    }
})();
'use strict';

angular.module('angular-base64', []).provider('Base64', function () {
    this.$get = ['$window', function ($window) {
        return $window.Base64;
    }];
});
'use strict';

angular.module('angular-moment', []).provider('moment', function () {
    this.$get = ['$window', function ($window) {
        return $window.moment;
    }];
});
'use strict';

angular.module('angular-yamljs', []).provider('YAML', function () {
    this.$get = ['$window', function ($window) {
        return $window.YAML;
    }];
});
'use strict';

(function () {
    'use strict';

    CloseDialogService.$inject = ['$document', '$rootScope', 'lodash', 'ngDialog', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').factory('CloseDialogService', CloseDialogService);

    function CloseDialogService($document, $rootScope, lodash, ngDialog, EventHelperService) {
        var scope = $rootScope.$new();
        var isUploadImageWindowOpen = false;
        var isChangesHaveBeenMade = false;

        activate();

        return {
            toggleIsUploadImageWindowOpen: toggleIsUploadImageWindowOpen
        };

        //
        // Public methods
        //

        /**
         * Toggles flag of isUploadImageWindowOpen
         */
        function toggleIsUploadImageWindowOpen() {
            isUploadImageWindowOpen = !isUploadImageWindowOpen;
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         */
        function activate() {
            scope.$on('wizard_changes-have-been-made', onChanges);
            scope.$on('text-edit_changes-have-been-made', onChanges);

            // array of the IDs of opened ndDialogs
            // will change if some ngDialog have been opened or closed
            scope.ngDialogs = ngDialog.getOpenDialogs();

            scope.$watchCollection('ngDialogs', function (newVal, oldVal) {
                if (lodash.isEmpty(oldVal) && newVal.length === 1) {
                    $document.on('keyup', onKeyUp);
                } else if (lodash.isEmpty(newVal)) {
                    $document.off('keyup', onKeyUp);

                    isChangesHaveBeenMade = false;
                }
            });
        }

        /**
         * Closes last opened dialog
         */
        function onKeyUp(event) {
            if (event.keyCode === EventHelperService.ESCAPE) {
                if (isUploadImageWindowOpen || isChangesHaveBeenMade && scope.ngDialogs.length === 1) {
                    isUploadImageWindowOpen = false;

                    $rootScope.$broadcast('close-dialog-service_close-dialog');
                } else {
                    ngDialog.close(lodash.last(scope.ngDialogs));

                    if (lodash.isEmpty(scope.ngDialogs)) {
                        $document.off('keyup', onKeyUp);
                    }
                }

                scope.$digest();
            }
        }

        /**
         * Broadcast callback which should be called when wizards has some changes
         * Sends from such wizards: new container wizard, new storage pool wizard
         * @param {Object} event - broadcast event object
         * @param {boolean} data - broadcast data
         */
        function onChanges(event, data) {
            isChangesHaveBeenMade = data;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').factory('CommonTableService', CommonTableService);

    function CommonTableService() {
        return {
            getColumnSortingClasses: getColumnSortingClasses
        };

        //
        // Public methods
        //

        /**
         * Checks whether the passed column name equals the last sorted column name
         * @param {string} columnName
         * @param {string} lastSortedColumnName
         * @param {boolean} isReversed
         * @returns {{sorted: boolean, reversed: boolean}} - an object with css class names suitable for `ng-class`
         */
        function getColumnSortingClasses(columnName, lastSortedColumnName, isReversed) {
            var classes = {
                'sorted': false,
                'reversed': false
            };
            if (columnName === lastSortedColumnName) {
                classes.sorted = true;
                classes.reversed = isReversed;
            }
            return classes;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    DialogsService.$inject = ['$q', '$i18next', 'i18next', 'lodash', 'ngDialog', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').factory('DialogsService', DialogsService);

    function DialogsService($q, $i18next, i18next, lodash, ngDialog, FormValidationService) {
        return {
            alert: alert,
            confirm: confirm,
            customConfirm: customConfirm,
            image: image,
            oopsAlert: oopsAlert,
            prompt: prompt,
            text: text
        };

        //
        // Public methods
        //

        /**
         * Show alert message
         *
         * @param {string|Array.<string>} [alertText] - alert content
         * @param {string} [buttonText=OK] - text displayed on Ok button
         * @returns {Promise} a promise that resolves on closing dialog
         */
        function alert(alertText, buttonText) {
            buttonText = lodash.defaultTo(buttonText, $i18next.t('common:OK', { lng: i18next.language }));

            if (lodash.isArray(alertText)) {
                alertText = alertText.length === 1 ? lodash.first(alertText) : '<ul class="error-list"><li class="error-list-item">' + alertText.join('</li><li class="error-list-item">') + '</li></ul>';
            }

            return ngDialog.open({
                template: '<div class="notification-text title igz-scrollable-container" data-ng-scrollbars>' + alertText + '</div>' + '<div class="buttons">' + '<button class="igz-button-primary" data-ng-click="closeThisDialog() || $event.stopPropagation()" ' + 'data-test-id="general.alert_ok.button">' + buttonText + '</button></div>',
                plain: true
            }).closePromise;
        }

        /**
         * Show confirmation dialog
         *
         * @param {string|Object} confirmText that will be shown in pop-up
         * @param {string} [confirmText.message] the text of the dialog body
         * @param {string} [confirmText.description] additional info
         * @param {string} confirmButton Text displayed on Confirm button
         * @param {string} [cancelButton=Cancel] Text displayed on Cancel button
         * @param {string} type - type of popup dialog
         * @returns {Object}
         */
        function confirm(confirmText, confirmButton, cancelButton, type) {
            var confirmMessage = type === 'nuclio_alert' && lodash.isPlainObject(confirmText) ? confirmText.message : confirmText;

            var confirmButtonClass = lodash.includes(['critical_alert', 'nuclio_alert'], type) ? 'igz-button-remove' : 'igz-button-primary';

            var cancelButtonCaption = lodash.defaultTo(cancelButton, $i18next.t('common:CANCEL', {
                lng: i18next.language
            }));
            var noDescription = type !== 'nuclio_alert' || lodash.isEmpty(confirmText.description);

            var template = '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="nuclio-alert-icon"></div><div class="notification-text title">' + confirmMessage + '</div>' + (noDescription ? '' : '<div class="notification-text description">' + confirmText.description + '</div>') + '<div class="buttons">' + '<button class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(0)" ' + 'data-test-id="general.confirm_cancel.button" ' + 'data-ng-keydown="$event.keyCode === 13 && closeThisDialog(0)">' + cancelButtonCaption + '</button>' + '<button class="' + confirmButtonClass + '" tabindex="0" data-ng-click="confirm(1)" ' + 'data-test-id="general.confirm_confirm.button" data-ng-keydown="$event.keyCode === 13 && confirm(1)">' + confirmButton + '</button>' + '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                className: type === 'nuclio_alert' ? 'ngdialog-theme-nuclio delete-entity-dialog-wrapper' : 'ngdialog-theme-iguazio'
            });
        }

        /**
         * Show confirmation dialog with custom number of buttons
         * @param {string} confirmText that will be shown in pop-up
         * @param {string} cancelButton Text displayed on Cancel button
         * @param {Array} actionButtons Array of action buttons
         * @returns {Object}
         */
        function customConfirm(confirmText, cancelButton, actionButtons) {
            var template = '<div class="notification-text title">' + confirmText + '</div>' + '<div class="buttons">' + '<button class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(-1)" ' + 'data-test-id="general.confirm_cancel.button" ' + 'data-ng-keydown="$event.keyCode === 13 && closeThisDialog(-1)">' + cancelButton + '</button>';
            lodash.each(actionButtons, function (button, index) {
                template += '<button class="igz-button-primary" tabindex="0" data-ng-click="confirm(' + index + ')" data-test-id="general.confirm_confirm_' + index + '.button" ' + 'data-ng-keydown="$event.keyCode === 13 && confirm(' + index + ')">' + button + '</button>';
            });
            template += '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                trapFocus: false
            });
        }

        /**
         * Show image
         *
         * @param {string} src that will be shown in pop-up
         * @param {string} [label] actual filename to be shown in title
         * @returns {Promise}
         */
        function image(src, label) {
            label = angular.isString(label) ? label : $i18next.t('common:TOOLTIP.IMAGE_PREVIEW', { lng: i18next.language }) + ':';

            return ngDialog.open({
                template: '<div class="title text-ellipsis"' + 'data-uib-tooltip="' + label + '"' + 'data-tooltip-popup-delay="400"' + 'data-tooltip-append-to-body="true"' + 'data-tooltip-placement="bottom-left">' + label + '</div>' + '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="image-preview-container">' + '<img class="image-preview" src="' + src + '" alt="' + $i18next.t('common:HAVE_NO_PERMISSIONS_TO_READ_FILE', { lng: i18next.language }) + '"/></div>',
                plain: true,
                className: 'ngdialog-theme-iguazio image-dialog'
            }).closePromise;
        }

        /**
         * Show oops alert message when server is unreachable
         * @param {string} alertText that will be shown in pop-up
         * @param {string} buttonText displayed on Ok button
         * @returns {Promise}
         */
        function oopsAlert(alertText, buttonText) {
            return ngDialog.open({
                template: '<div class="header"></div><div class="notification-text">' + alertText + '</div>' + '<div class="buttons">' + '<button class="refresh-button no-padding" data-ng-click="closeThisDialog()" ' + 'data-test-id="general.oops_refresh.button" ' + '<span class="igz-icon-refresh"></span>' + buttonText + '</button>' + '</div>',
                plain: true,
                className: 'ngdialog-theme-iguazio oops-dialog'
            }).closePromise;
        }

        /**
         * Show confirmation dialog with input field
         *
         * @param {string} promptText that will be shown in pop-up
         * @param {string} [okButton='OK'] Text displayed on Confirm button
         * @param {string} [cancelButton='Cancel'] Text displayed on Cancel button
         * @param {string} [defaultValue=''] Value that should be shown in text input after prompt is opened
         * @param {string} [placeholder=''] Text input placeholder
         * @param {Object} [validation] Validation pattern
         * @param {boolean} [required=false] Should input be required or not
         * @returns {Object}
         */
        function prompt(promptText, okButton, cancelButton, defaultValue, placeholder, validation, required) {
            var lng = i18next.language;
            var okButtonCaption = lodash.defaultTo(okButton, $i18next.t('common:OK', { lng: lng }));
            var cancelButtonCaption = lodash.defaultTo(cancelButton, $i18next.t('common:CANCEL', { lng: lng }));
            var data = {
                value: lodash.defaultTo(defaultValue, ''),
                igzDialogPromptForm: {},
                checkInput: function checkInput() {
                    if (angular.isDefined(validation) || required) {
                        data.igzDialogPromptForm.$submitted = true;
                    }
                    return data.igzDialogPromptForm.$valid;
                },
                inputValueCallback: function inputValueCallback(newData) {
                    data.value = newData;
                }
            };

            if (angular.isDefined(validation) || required) {
                lodash.assign(data, {
                    validation: validation,
                    inputName: 'promptName',
                    isShowFieldInvalidState: FormValidationService.isShowFieldInvalidState
                });
            }

            return ngDialog.open({
                template: '<div data-ng-form="ngDialogData.igzDialogPromptForm">' + '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="notification-text title">' + promptText + '</div>' + '<div class="main-content">' + '<div class="field-group">' + '<div class="field-input">' + '<igz-validating-input-field ' + 'data-field-type="input" ' + 'data-input-name="promptName" ' + 'data-input-value="ngDialogData.value" ' + 'data-form-object="ngDialogData.igzDialogPromptForm" ' + 'data-is-focused="true" ' + (angular.isUndefined(validation) ? '' : 'data-validation-pattern="ngDialogData.validation" ' + 'data-only-valid-characters="true" data-trim="false" ') + (lodash.isEmpty(placeholder) ? '' : 'data-placeholder-text="' + placeholder + '" ') + (lodash.defaultTo(required, false) ? 'data-validation-is-required="true" ' : '') + 'data-update-data-callback="ngDialogData.inputValueCallback(newData)"' + '></igz-validating-input-field>' + (angular.isDefined(validation) ? '<div class="error-text" data-ng-show="ngDialogData.isShowFieldInvalidState(ngDialogData.igzDialogPromptForm, ngDialogData.inputName)">' + $i18next.t('common:ERROR_MSG.INVALID_INPUT_PLEASE_TRY_AGAIN', { lng: lng }) + '</div>' : '') + '</div>' + '</div>' + '</div>' + '</div>' + '<div class="buttons">' + '<button class="igz-button-just-text" data-ng-click="closeThisDialog()" ' + 'data-test-id="general.prompt_cancel.button">' + cancelButtonCaption + '</button>' + '<button class="igz-button-primary" ' + 'data-ng-click="ngDialogData.checkInput() && closeThisDialog(ngDialogData.value)" ' + 'data-test-id="general.prompt_ok.button">' + okButtonCaption + '</button>' + '</div>',
                plain: true,
                data: data
            }).closePromise.then(function (dialog) {
                // if Cancel is clicked, reject the promise
                return angular.isDefined(dialog.value) ? dialog.value : $q.reject($i18next.t('common:ERROR_MSG.CANCELLED', { lng: lng }));
            });
        }

        /**
         * Shows text
         *
         * @param {string} content that will be shown in pop-up
         * @param {Object} [node] actual node to be shown
         * @param {function} submitData function for submitting data
         * @param {string} language the language to use in text editor
         * @returns {Promise}
         */
        function text(content, node, submitData, language) {
            var lng = i18next.language;
            var data = {
                closeButtonText: $i18next.t('common:CLOSE', { lng: lng }),
                submitButtonText: $i18next.t('common:SAVE', { lng: lng }),
                submitData: submitData,
                label: angular.isString(node.label) ? node.label : 'Text preview:',
                node: node,
                content: content,
                language: language
            };

            return ngDialog.open({
                template: '<igz-text-edit data-label="{{ngDialogData.label}}" data-language="{{ngDialogData.language}}" data-content="{{ngDialogData.content}}"' + 'data-submit-button-text="{{ngDialogData.submitButtonText}}" data-submit-data="ngDialogData.submitData(newContent)"' + 'data-close-button-text="{{ngDialogData.closeButtonText}}" data-close-dialog="closeThisDialog()" data-node="ngDialogData.node">' + '</igz-text-edit>',
                plain: true,
                data: data,
                className: 'ngdialog-theme-iguazio text-edit'
            }).closePromise;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').factory('EventHelperService', EventHelperService);

    function EventHelperService() {
        return {
            BACKSPACE: 8,
            DOWN: 40,
            ENTER: 13,
            ESCAPE: 27,
            SPACE: 32,
            TABKEY: 9,
            UP: 38,
            isLeftMousePressed: isLeftMousePressed,
            isRightMousePressed: isRightMousePressed,
            isCtrlOrCmdPressed: isCtrlOrCmdPressed,
            isShiftPressed: isShiftPressed
        };

        //
        // Public methods
        //

        /**
         * Checks whether the event invoked by left mouse click
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isLeftMousePressed(event) {
            return event.which === 1;
        }

        /**
         * Checks whether the event invoked by left mouse click
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isRightMousePressed(event) {
            return event.which === 3;
        }

        /**
         * Checks whether Shift key was pressed when the event invoked
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isShiftPressed(event) {
            return event.shiftKey;
        }

        /**
         * Checks whether Ctrl or Cmd key was pressed when the event invoked
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isCtrlOrCmdPressed(event) {
            return event.ctrlKey || event.metaKey;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FormValidationService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('FormValidationService', FormValidationService);

    // Service with helpers methods for form validation needs
    function FormValidationService(lodash) {
        return {
            isShowFormInvalidState: isShowFormInvalidState,
            isShowFieldInvalidState: isShowFieldInvalidState,
            isShowFieldError: isShowFieldError,
            isFormValid: isFormValid,
            isFieldValid: isFieldValid
        };

        /**
         * Check if the form is in an invalid state
         * @param {Object} form - form to check
         * @returns {boolean}
         */
        function isShowFormInvalidState(form) {
            return !form ? false : lodash.some(form, function (property) {
                return property.charAt(0) !== '$' && // skip AngularJS native properties
                form[property].hasOwnProperty('$dirty') && form[property].hasOwnProperty('$invalid') && isShowFieldInvalidState(form, property);
            });
        }

        /**
         * Check if the field is in an invalid state
         * @param {Object} form - form which owns the field
         * @param {string} elementName - field name
         * @returns {boolean}
         */
        function isShowFieldInvalidState(form, elementName) {
            return !form || !form[elementName] ? false : (form.$submitted || form[elementName].$dirty) && form[elementName].$invalid;
        }

        /**
         * Check if the field has a specific error
         * @param {Object} form - form which owns the field
         * @param {string} elementName - field name
         * @param {string} errorName - error name
         * @returns {boolean}
         */
        function isShowFieldError(form, elementName, errorName) {
            return !form || !form[elementName] ? false : form[elementName].$error[errorName];
        }

        /**
         * Check if the form is valid
         * @param {Object} form - form to check
         * @returns {boolean}
         */
        function isFormValid(form) {
            return !form ? true : lodash.every(form, function (property) {
                return property.charAt(0) === '$' || // skip AngularJS native properties
                !form[property].hasOwnProperty('$valid') || isFieldValid(form, property);
            });
        }

        /**
         * Check if the field of the form is valid
         * @param {Object} form - form which owns the field
         * @param {string} elementName - name of the field to check
         * @param {boolean} [validateOnSubmit=false] - if this parameter was passed, that means next -
         *     validate field only if form was submitted. Otherwise validates field all the time
         * @returns {boolean}
         */
        function isFieldValid(form, elementName, validateOnSubmit) {
            var formSubmitted = lodash.get(form, '$submitted', false);
            var elementValid = lodash.get(form, elementName + '.$valid', true);

            return lodash.defaultTo(validateOnSubmit, false) && !formSubmitted || elementValid;
        }
    }
})();
'use strict';

angular.module('angular-i18next', []).provider('i18next', [function () {
    this.$get = ['$window', function ($window) {
        return $window.i18next;
    }];
}]);
'use strict';

(function () {
    'use strict';

    LocalStorageService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('LocalStorageService', LocalStorageService);

    function LocalStorageService(lodash) {
        return {
            clearAll: clearAll,
            getItem: getItem,
            removeItem: removeItem,
            setItem: setItem
        };

        //
        // Public methods
        //

        /**
         * Removes all data from local storage
         */
        function clearAll() {
            localStorage.clear();
        }

        /**
         * Directly gets a value from local storage
         * @param {string} namespace - localStorage namespace (e.g.: 'login', 'session')
         * @param {string} key - key nested in namespace
         * @returns {*} value stored at `key` in `namespace` object stored at `namespace` in `localStorage`, or
         *     the entire namespace as a plain object
         */
        function getItem(namespace, key) {
            var namespaceObject = getNamespace(namespace);
            return arguments.length === 1 ? namespaceObject : lodash.get(namespaceObject, key, null);
        }

        /**
         * Removes keys from localStorage
         * @param {string} namespace - localStorage namespace (e.g.: 'login', 'session')
         * @param {Array.<string>|string} keys - key(s) to be removed; if not provided, removes the entire namespace
         */
        function removeItem(namespace, keys) {
            if (arguments.length === 1) {
                localStorage.removeItem(namespace);
            } else {
                var namespaceObject = getNamespace(namespace);

                if (!lodash.isNil(namespaceObject)) {

                    // omit provided keys from provided namespace,
                    var reducedNamespace = lodash.omit(getNamespace(namespace), keys);

                    // update the provided namespace with the result
                    localStorage.setItem(namespace, angular.toJson(reducedNamespace));
                }
            }
        }

        /**
         * Directly adds a value to local storage
         * @param {string} namespace - localStorage namespace (e.g.: 'login', 'session')
         * @param {string|Object} key - key to be set. If key is object then set whole object to localStorage.
         *     Otherwise add/set key-value pair to existing localStorage object.
         * @param {string} value - value to be set
         */
        function setItem(namespace, key, value) {
            if (arguments.length === 2 && lodash.isObject(key)) {
                localStorage.setItem(namespace, angular.toJson(key));
            } else if (arguments.length > 2 && lodash.isString(key) && !lodash.isNil(value)) {
                var localStorageObject = getNamespace(namespace);

                if (lodash.isNil(localStorageObject)) {
                    localStorageObject = {};
                }

                lodash.set(localStorageObject, [key], value);
                localStorage.setItem(namespace, angular.toJson(localStorageObject));
            }
        }

        //
        // Private methods
        //

        /**
         * Retrieves the value of `namespace` in local storage as a plain object
         * @param {string} namespace - the namespace to retrieve
         * @returns {?Object} the de-serialized JSON string in `namespace` key in `localStorage`
         *     or `null` if `namespace` does not exist in `localStorage` or if its content is not a serialized JSON
         */
        function getNamespace(namespace) {
            try {
                return angular.fromJson(localStorage.getItem(namespace));
            } catch (error) {
                return null;
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /*
     * Increase/set-back scrollable mCSB_container height if needed
     * to be able to scroll it down to see dropdown hidden by container's overflow
     *
     * Usage:
     * 1) Init method with passed needed element and class selectors (inside link-function)
     * preventDropdownCutOff(element, '.dropdown-element-class', '.scrollable-element-class');
     *
     * !!!Please note that service is using "enter" and "leave" animation events of `$animate` service.
     * The following directives support these events:
     * - ngRepeat
     * - ngView
     * - ngInclude
     * - ngSwitch
     * - ngIf
     * - ngMessage
     */

    PreventDropdownCutOffService.$inject = ['$animate', '$document'];
    angular.module('iguazio.dashboard-controls').factory('PreventDropdownCutOffService', PreventDropdownCutOffService);

    function PreventDropdownCutOffService($animate, $document) {

        // Margin for the better look
        var MARGIN_BOTTOM = 15;

        return {
            preventDropdownCutOff: preventDropdownCutOff,
            resizeScrollBarContainer: resizeScrollBarContainer,
            onShowPreventDropdownCutOff: onShowPreventDropdownCutOff
        };

        //
        // Public methods
        //

        /**
         * Increase/set-back scrollable mCSB_container height if needed to be able to scroll down it to see dropdown
         * hidden by container's overflow
         * @param {Object} currentElement - dropdown directive element
         * @param {string} dropdownElementClass - dropdown menu element class selector
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * class should be in one class together with ".mCSB_container" class
         */
        function preventDropdownCutOff(currentElement, dropdownElementClass, scrollableElementClass) {
            var dropdownElement;
            var scrollableElement;

            $animate.on('enter', currentElement, function (element, phase) {
                dropdownElement = currentElement.find(dropdownElementClass).last();

                if (dropdownElement[0] === element[0]) {
                    scrollableElement = resizeElement(currentElement, dropdownElement, scrollableElementClass, phase);
                }
            });

            $animate.on('leave', currentElement, function (element, phase) {
                if (angular.isElement(dropdownElement) && dropdownElement[0] === element[0] && phase === 'close') {
                    scrollableElement.height('auto');
                }
            });
        }

        /**
         * Resize scrollBar container('.mCSB_container') regarding target element.
         * If targetElement does not visible through cutOff then resize scrollBar container to needed height.
         * @param {Object} currentElement - contains target element
         * @param {Object} targetElement - scrollBar container should be resized regarding this element
         */
        function resizeScrollBarContainer(currentElement, targetElement) {
            var scrollbarContainer = currentElement.closest('.mCSB_container');
            var newHeight = currentElement.find(targetElement).offset().top + currentElement.find(targetElement).height();

            scrollbarContainer.css('height', (newHeight > scrollbarContainer.css('height') ? newHeight : scrollbarContainer.css('height')) + 'px');
        }

        /**
         * Increase/set-back scrollable mCSB_container height and it's parent
         * to be able to scroll down it to see dropdown hidden by container's overflow
         * should be used with ng-show
         * @param {Object} currentElement - dropdown directive element
         * @param {string} dropdownElementClass - dropdown menu element class selector
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * class should be in one class together with ".mCSB_container" class
         */
        function onShowPreventDropdownCutOff(currentElement, dropdownElementClass, scrollableElementClass) {
            $animate.on('removeClass', currentElement, function (element, phase) {
                var dropdownElement = currentElement.find(dropdownElementClass).last();

                if (dropdownElement[0] === element[0]) {
                    resizeElement(currentElement, dropdownElement, scrollableElementClass, phase);
                }
            });
        }

        /**
         * Resize element and parent to prevent dropdown cutoff
         * @param {Object} currentElement - dropdown directive element
         * @param {Object} dropdownElement - dropdown menu directive element
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * @param {string} phase - current phase from the event
         */
        function resizeElement(currentElement, dropdownElement, scrollableElementClass, phase) {
            var scrollableElement;
            var parentScrollableElement;

            // Set default scrollable container class if undefined
            scrollableElementClass = scrollableElementClass || '.mCSB_container';

            scrollableElement = currentElement.closest(scrollableElementClass);
            if (scrollableElement.length > 0 && (phase === 'close' || phase === 'start')) {
                parentScrollableElement = scrollableElement.parent();

                var dropDownOffsetBottom = $document.height() - dropdownElement.outerHeight(true) - dropdownElement.offset().top;
                var containerOffsetBottom = $document.height() - scrollableElement.outerHeight(true) - scrollableElement.offset().top;
                var newHeight = scrollableElement.outerHeight(true) + (containerOffsetBottom - dropDownOffsetBottom) + MARGIN_BOTTOM;

                if (dropDownOffsetBottom < containerOffsetBottom) {

                    // Set scrollableElement's height to needed value
                    scrollableElement.height(newHeight);
                    if (parentScrollableElement.height() < newHeight) {
                        parentScrollableElement.height(newHeight);
                    }
                }
            } else {
                scrollableElement.height('auto');
            }

            return scrollableElement;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    PriorityDropdownService.$inject = ['$i18next', 'i18next'];
    angular.module('iguazio.dashboard-controls').factory('PriorityDropdownService', PriorityDropdownService);

    function PriorityDropdownService($i18next, i18next) {
        return {
            getName: getName,
            getPrioritiesArray: getPrioritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of priority types
         * @returns {Array}
         */
        function getPrioritiesArray() {
            var lng = i18next.language;

            return [{
                name: $i18next.t('common:REAL_TIME', { lng: lng }),
                type: 'realtime',
                icon: {
                    name: 'igz-icon-priority-realtime'
                }
            }, {
                name: $i18next.t('common:HIGH', { lng: lng }),
                type: 'high',
                icon: {
                    name: 'igz-icon-priority-high'
                }
            }, {
                name: $i18next.t('common:STANDARD', { lng: lng }),
                type: 'standard',
                icon: {
                    name: 'igz-icon-priority-standard'
                }
            }, {
                name: $i18next.t('common:LOW', { lng: lng }),
                type: 'low',
                icon: {
                    name: 'igz-icon-priority-low'
                }
            }];
        }

        /**
         * Gets name of priority depends on type
         * @param {string} type
         * @returns {string}
         */
        function getName(type) {
            var lng = i18next.language;

            return type === 'realtime' ? $i18next.t('common:REAL_TIME', { lng: lng }) : type === 'high' ? $i18next.t('common:HIGH', { lng: lng }) : type === 'standard' ? $i18next.t('common:STANDARD', { lng: lng }) : type === 'low' ? $i18next.t('common:LOW', { lng: lng }) : '';
        }
    }
})();
'use strict';

(function () {
    'use strict';

    SeverityDropdownService.$inject = ['$i18next', 'i18next'];
    angular.module('iguazio.dashboard-controls').factory('SeverityDropdownService', SeverityDropdownService);

    function SeverityDropdownService($i18next, i18next) {
        return {
            getSeveritiesArray: getSeveritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of severity types
         * @returns {Array}
         */
        function getSeveritiesArray() {
            var lng = i18next.language;
            return [{
                name: $i18next.t('common:ERROR', { lng: lng }),
                type: 'error',
                icon: {
                    name: 'igz-icon-warning severity-icon critical'
                }
            }, {
                name: $i18next.t('common:DEBUG', { lng: lng }),
                type: 'debug',
                icon: {
                    name: 'igz-icon-warning severity-icon major'
                }
            }, {
                name: $i18next.t('common:WARNING', { lng: lng }),
                type: 'warning',
                icon: {
                    name: 'igz-icon-warning severity-icon warning'
                }
            }, {
                name: $i18next.t('common:INFO', { lng: lng }),
                type: 'info',
                icon: {
                    name: 'igz-icon-info-round severity-icon info'
                }
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    UnloadPageService.$inject = ['$window'];
    angular.module('iguazio.dashboard-controls').factory('UnloadPageService', UnloadPageService);

    function UnloadPageService($window) {
        return {
            registerBeforeUnloadPageCallback: registerBeforeUnloadPageCallback
        };

        //
        // Public methods
        //

        /**
         * Registers beforeunload page callback.
         * It calls isDataChanged callback to track if changes has been made on the page.
         * If yes - then show confirmation dialog which prevents from user to lose unsaved data
         * @param {Function} isDataChanged - callback which tracks if changes has been made
         */
        function registerBeforeUnloadPageCallback(isDataChanged) {

            // @if !IGZ_E2E_TESTING
            $window.addEventListener('beforeunload', function (e) {
                if (isDataChanged()) {

                    // Cancel the event
                    e.preventDefault();

                    // Chrome requires returnValue to be set
                    e.returnValue = true;
                }
            });
            // @endif
        }
    }
})();
'use strict';

(function () {
    'use strict';

    ValidatingPatternsService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('ValidatingPatternsService', ValidatingPatternsService);

    function ValidatingPatternsService(lodash) {
        return {
            boolean: /^(0|1)$/,
            browseAttributeName: /^[A-Za-z_][A-Za-z0-9_]*$/,
            container: /^(?!.*--)(?!.*__)(?=.*[a-z])[a-z0-9][a-z0-9-_]*[a-z0-9]$|^[a-z]$/,
            digits: /^\+?(0|[1-9]\d*)$|^$/,
            email: /^[^@]+@[^@]+\.[^@]+$/,
            float: /^\d{1,9}(\.\d{1,2})?$/,
            floatingPoint: /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/,
            fullName: /^[a-zA-Z][a-zA-Z- ]*$/,
            functionName: /^(?=[\S\s]{1,63}$)[a-z]([-a-z0-9]*[a-z0-9])?$/,
            geohash: /^[a-z0-9]*$/,
            hostName_IpAddress: /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)|(^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$)/,
            id: /^[a-zA-Z0-9\-]*$/,
            ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            k8s: {
                envVarName: /^(?!\.$)(?!\.\.[\S\s]*$)[-._a-zA-Z][-._a-zA-Z0-9]*$/
            },
            mask: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/,
            name: /^[a-zA-Z0-9_]*$/,
            negativeFloat: /^[-]?\d{1,9}(\.\d{1,2})?$/,
            negativeInteger: /^[-]?(0|[1-9]\d*)$|^$/,
            networkName: /^[a-zA-Z0-9\.\-\()\\\/:\s]*$/,
            noSpacesNoSpecChars: /^[A-Za-z0-9_-]*$/,
            password: /^.{6,128}$/,
            path: /^(\/[\w-]+)+(.[a-zA-Z]+?)$/,
            percent: /^([1-9]|[1-9][0-9]|100)$/,
            phone: /^\+?\d[\d\-]{4,17}$/,
            protocolIpPortAddress: /^[a-z]{2,6}\:\/\/(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))(\:\d{1,5})?$/,
            storage: /^[a-zA-Z0-9]+?\:\/\/[a-zA-Z0-9\_\-\.]+?\:[a-zA-Z0-9\_\-\./]+?\@[a-zA-Z0-9\_\-\.]+?$/,
            tenantName: /^(?=.{1,31}$)[a-zA-Z]([a-zA-Z0-9_]*[a-zA-Z0-9])?$/,
            timestamp: /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?((?:[+-](?:[0-1]\d|2[0-3]):[0-5]\d)|Z)?$/,
            url: /^[a-zA-Z0-9]+?\:\/\/[a-zA-Z0-9\_\-\.]+?\:[a-zA-Z0-9\_\-\.]+?\@[a-zA-Z0-9\_\-\.]+?$/,
            username: /^(?=.{1,32}$)[a-zA-Z][-_a-zA-Z0-9]*$/,
            usernameAndTenantName: /^(?=.{1,32}(@|$))[a-zA-Z][-_a-zA-Z0-9]*(@(?=.{1,31}$)[a-zA-Z]([a-zA-Z0-9_]*[a-zA-Z0-9])?)?$/,

            getMaxLength: getMaxLength
        };

        //
        // Public methods
        //

        /**
         * Provides maximum length of text that can be filled in input
         * @param {string} path - path to field
         * @returns {number}
         */
        function getMaxLength(path) {
            var lengths = {
                default: 128,
                cluster: {
                    description: 150
                },
                escalation: {
                    name: 40
                },
                'function': {
                    name: 63
                },
                group: {
                    description: 128
                },
                interface: {
                    alias: 40
                },
                network: {
                    name: 30,
                    description: 150,
                    subnet: 30,
                    mask: 150,
                    tag: 10
                },
                node: {
                    description: 128
                },
                container: {
                    description: 150
                },
                storagePool: {
                    name: 30,
                    description: 150,
                    url: 100,
                    username: 30
                },
                user: {
                    firstName: 30,
                    lastName: 30,
                    username: 32
                },
                tenant: {
                    name: 31
                }
            };

            return lodash.get(lengths, path, lengths.default);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /*
     * Gets window height and width
     */

    WindowDimensionsService.$inject = ['$window', '$document'];
    angular.module('iguazio.dashboard-controls').factory('WindowDimensionsService', WindowDimensionsService);

    function WindowDimensionsService($window, $document) {
        return {
            height: height,
            width: width,
            addOverflow: addOverflow,
            removeOverflow: removeOverflow,
            getElementPosition: getElementPosition
        };

        //
        // Public methods
        //

        function height() {
            var doc = $document[0];
            return $window.innerHeight || doc.documentElement.clientHeight || doc.body.clientHeight;
        }

        function width() {
            var doc = $document[0];
            return $window.innerWidth || doc.documentElement.clientWidth || doc.body.clientWidth;
        }

        /**
         * Method removes class which sets overflow to hidden
         */
        function addOverflow() {
            var elem = angular.element(document).find('body');
            elem.removeClass('no-overflow');
        }

        /**
         * Method adds class which sets overflow to hidden
         */
        function removeOverflow() {
            var elem = angular.element(document).find('body');
            elem.addClass('no-overflow');
        }

        /**
         * Calculates offset position of element according to its parent
         * @param {HTMLElement} el
         * @param {HTMLElement} parent
         * @returns {{left: number, top: number, right: number, bottom: number}}
         */
        function getElementPosition(el, parent) {
            var pos = {
                left: 0,
                top: 0,
                right: el.offsetWidth,
                bottom: el.offsetHeight
            };

            while (el.offsetParent && el.offsetParent !== parent) {
                pos.left += el.offsetLeft;
                pos.top += el.offsetTop;
                el = el.offsetParent;
            }

            pos.right += pos.left;
            pos.bottom += pos.top;

            return pos;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionCheckbox.$inject = ['$scope', '$rootScope'];
    angular.module('iguazio.dashboard-controls').component('igzActionCheckbox', {
        bindings: {
            item: '<',
            onClickCallback: '&?'
        },
        templateUrl: 'igz_controls/components/action-checkbox/action-checkbox.tpl.html',
        controller: IgzActionCheckbox
    });

    function IgzActionCheckbox($scope, $rootScope) {
        var ctrl = this;

        ctrl.onCheck = onCheck;
        ctrl.$onInit = $onInit;

        //
        // Public methods
        //

        /**
         * Handles mouse click on checkbox
         * @param {Object} $event - event object
         */
        function onCheck($event) {
            ctrl.item.ui.checked = !ctrl.item.ui.checked;

            if (angular.isFunction(ctrl.onClickCallback)) {
                $event.stopPropagation();
                ctrl.onClickCallback();
            }

            $rootScope.$broadcast('action-checkbox_item-checked', { checked: ctrl.item.ui.checked });
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         */
        function $onInit() {
            $scope.$on('action-checkbox-all_check-all', toggleCheckedAll);
        }

        /**
         * Triggers on Check all button clicked
         * @param {Object} event
         * @param {Object} data
         */
        function toggleCheckedAll(event, data) {
            if (ctrl.item.ui.checked !== data.checked) {
                ctrl.item.ui.checked = !ctrl.item.ui.checked;
            }

            if (angular.isFunction(ctrl.onClickCallback)) {
                ctrl.onClickCallback();
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItemSubtemplateController.$inject = ['$compile', '$element'];
    angular.module('iguazio.dashboard-controls').component('igzActionItemSubtemplate', {
        bindings: {
            action: '<'
        },
        template: '<div class="igz-action-item-subtemplate"></div>',
        controller: IgzActionItemSubtemplateController
    });

    function IgzActionItemSubtemplateController($compile, $element) {
        var ctrl = this;

        ctrl.newScope = null;

        ctrl.$postLink = postLink;

        //
        // Hook methods
        //

        /**
         * Post linking method
         */
        function postLink() {
            var subTemplate = angular.element(ctrl.action.template);
            $element.find('.igz-action-item-subtemplate').append(subTemplate);

            ctrl.newScope = ctrl.action.scope.$new();
            ctrl.newScope.action = ctrl.action;
            $compile(subTemplate)(ctrl.newScope);

            ctrl.action.destroyNewScope = destroyNewScope;
        }

        //
        // Private method
        //

        /**
         * Destroy new created scope. Scope needs to be removed to prevent errors when viewing tags on the browse page.
         * And it needs to be done when updating panel actions
         */
        function destroyNewScope() {
            ctrl.newScope.$destroy();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItem.$inject = ['$document', '$element', '$rootScope', '$scope', '$timeout', 'lodash', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('igzActionItem', {
        bindings: {
            action: '<',
            actions: '<?',
            template: '@',
            onFilesDropped: '<?'
        },
        templateUrl: 'igz_controls/components/action-item/action-item.tpl.html',
        controller: IgzActionItem
    });

    function IgzActionItem($document, $element, $rootScope, $scope, $timeout, lodash, DialogsService) {
        var ctrl = this;

        ctrl.$onInit = onInit();
        ctrl.$onDestroy = onDestroy();
        ctrl.isItemVisible = isItemVisible;
        ctrl.onClickAction = onClickAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $timeout(function () {
                lodash.defaults(ctrl.action, {
                    visible: true
                });
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (angular.isDefined(ctrl.action) && angular.isDefined(ctrl.action.template)) {
                detachDocumentEvent();
            }
        }

        //
        // Public methods
        //

        /**
         * Handles mouse click on action item
         * @param {MouseEvent} event
         */
        function onClickAction(event) {
            if (ctrl.action.active) {
                if (!lodash.isNil(ctrl.action.popupText)) {
                    $rootScope.$broadcast('browse-action_change-loading-text', { textToDisplay: ctrl.action.popupText });
                }

                // shows confirmation dialog if action.confirm is true
                if (lodash.isNonEmpty(ctrl.action.confirm)) {
                    showConfirmDialog(event);
                } else {
                    ctrl.action.handler(ctrl.action, event);
                }

                // if action has sub-templates shows/hides it
                if (angular.isDefined(ctrl.action.template)) {
                    toggleTemplate();
                }

                // calls callback if defined
                if (angular.isFunction(ctrl.action.callback)) {
                    ctrl.action.callback(ctrl.action);
                }
            }
        }

        /**
         * Checks if the action item should be shown
         * @param {Object} action
         * @returns {boolean}
         */
        function isItemVisible(action) {
            return lodash.get(action, 'visible', true);
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', hideSubtemplate);
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', hideSubtemplate);
        }

        /**
         * Hides sub-template dropdown when user clicks outside it
         * @param {MouseEvent} event
         */
        function hideSubtemplate(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    ctrl.action.subTemplateProps.isShown = false;
                    detachDocumentEvent();
                }
            });
        }

        /**
         * Shows confirm dialog
         * @param {MouseEvent} event
         */
        function showConfirmDialog(event) {
            var message = lodash.isNil(ctrl.action.confirm.description) ? ctrl.action.confirm.message : {
                message: ctrl.action.confirm.message,
                description: ctrl.action.confirm.description
            };

            DialogsService.confirm(message, ctrl.action.confirm.yesLabel, ctrl.action.confirm.noLabel, ctrl.action.confirm.type).then(function () {
                ctrl.action.handler(ctrl.action, event);
            });
        }

        /**
         * Shows/hides sub-template
         */
        function toggleTemplate() {
            ctrl.action.subTemplateProps.isShown = !ctrl.action.subTemplateProps.isShown;
            if (ctrl.action.subTemplateProps.isShown) {
                attachDocumentEvent();
            } else {
                detachDocumentEvent();
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionCheckboxAllController.$inject = ['$scope', '$rootScope'];
    angular.module('iguazio.dashboard-controls').component('igzActionCheckboxAll', {
        bindings: {
            itemsCountOriginal: '<itemsCount',
            checkedItemsCount: '<?',
            onCheckChange: '&?'
        },
        templateUrl: 'igz_controls/components/action-checkbox-all/action-checkbox-all.tpl.html',
        controller: IgzActionCheckboxAllController
    });

    function IgzActionCheckboxAllController($scope, $rootScope) {
        var ctrl = this;

        ctrl.allItemsChecked = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.onCheckAll = onCheckAll;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.checkedItemsCount = angular.isUndefined(ctrl.checkedItemsCount) ? 0 : ctrl.checkedItemsCount;
            ctrl.itemsCount = angular.isUndefined(ctrl.itemsCount) ? 0 : ctrl.itemsCount;

            $scope.$on('action-checkbox_item-checked', toggleCheckedItem);
            $scope.$on('action-checkbox-all_change-checked-items-count', changeItemsCheckedCount);
            $scope.$on('action-checkbox-all_set-checked-items-count', setCheckedItemsCount);
        }

        /**
         * Changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.itemsCountOriginal)) {
                ctrl.itemsCount = ctrl.itemsCountOriginal;
                testAllItemsChecked();
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            ctrl.checkedItemsCount = 0;

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });
        }

        //
        // Public methods
        //

        /**
         * Calls when Check all button is clicked.
         */
        function onCheckAll() {
            ctrl.allItemsChecked = !ctrl.allItemsChecked;
            ctrl.checkedItemsCount = ctrl.allItemsChecked ? ctrl.itemsCount : 0;

            $rootScope.$broadcast('action-checkbox-all_check-all', {
                checked: ctrl.allItemsChecked,
                checkedCount: ctrl.checkedItemsCount
            });

            if (angular.isFunction(ctrl.onCheckChange)) {
                ctrl.onCheckChange({ checkedCount: ctrl.checkedItemsCount });
            }
        }

        //
        // Private methods
        //

        /**
         * Calls on checked items count change
         * @param {Object} event
         * @param {Object} data
         */
        function changeItemsCheckedCount(event, data) {
            if (data.changedCheckedItemsCount === 0) {
                ctrl.checkedItemsCount = 0;
            } else {
                ctrl.checkedItemsCount += data.changedCheckedItemsCount;
            }

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });
        }

        /**
         * Sets checked items count
         * @param {Object} event
         * @param {number} newCheckedItemsCount
         */
        function setCheckedItemsCount(event, newCheckedItemsCount) {
            ctrl.checkedItemsCount = newCheckedItemsCount;

            testAllItemsChecked();

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });
        }

        /**
         * Calls on checkbox check/uncheck
         * @param {Object} event
         * @param {Object} data
         */
        function toggleCheckedItem(event, data) {
            if (data.checked) {
                ctrl.checkedItemsCount++;
            } else {
                ctrl.checkedItemsCount--;
            }

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });

            testAllItemsChecked();

            // callback function is called to inform about checked items count
            if (angular.isFunction(ctrl.onCheckChange)) {
                ctrl.onCheckChange({ checkedCount: ctrl.checkedItemsCount });
            }
        }

        /**
         * Updates items count and toggle allItemsChecked flag
         */
        function testAllItemsChecked() {
            ctrl.allItemsChecked = ctrl.itemsCount > 0 && ctrl.checkedItemsCount === ctrl.itemsCount;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    ActionCheckboxAllService.$inject = ['$rootScope'];
    angular.module('iguazio.dashboard-controls').factory('ActionCheckboxAllService', ActionCheckboxAllService);

    function ActionCheckboxAllService($rootScope) {
        return {
            changeCheckedItemsCount: changeCheckedItemsCount,
            setCheckedItemsCount: setCheckedItemsCount
        };

        //
        // Public methods
        //

        /**
         * Sends broadcast with count of changed checked items
         * @param {number} changedCheckedItemsCount - number of changed checked items
         */
        function changeCheckedItemsCount(changedCheckedItemsCount) {
            $rootScope.$broadcast('action-checkbox-all_change-checked-items-count', {
                changedCheckedItemsCount: changedCheckedItemsCount
            });
        }

        /**
         * Sends broadcast with count of checked items
         * @param {number} checkedItemsCount
         */
        function setCheckedItemsCount(checkedItemsCount) {
            $rootScope.$broadcast('action-checkbox-all_set-checked-items-count', checkedItemsCount);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionMenuController.$inject = ['$scope', '$element', '$document', '$rootScope', '$timeout', '$i18next', 'i18next', 'lodash', 'ConfigService', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('igzActionMenu', {
        bindings: {
            actions: '<',
            shortcuts: '<',
            onFireAction: '<?',
            onClickShortcut: '<?',
            isMenuShown: '<?',
            iconClass: '@?',
            listClass: '<?'
        },
        templateUrl: 'igz_controls/components/action-menu/action-menu.tpl.html',
        controller: IgzActionMenuController
    });

    function IgzActionMenuController($scope, $element, $document, $rootScope, $timeout, $i18next, i18next, lodash, ConfigService, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isMenuShown = false;
        ctrl.preventDropdownCutOff = null;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;
        ctrl.$onChanges = onChanges;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.showDetails = showDetails;
        ctrl.toggleMenu = toggleMenu;
        ctrl.isVisible = isVisible;

        //
        // Hook methods
        //

        /**
         * Initialize method
         */
        function onInit() {
            ctrl.iconClass = lodash.defaultTo(ctrl.iconClass, 'igz-icon-context-menu');

            $scope.$on('close-all-action-menus', closeActionMenu);
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            var actions = lodash.get(changes, 'actions.currentValue');
            var shortcuts = lodash.get(changes, 'shortcuts.currentValue');
            var iconClass = lodash.get(changes, 'iconClass.currentValue');

            if (angular.isDefined(actions)) {
                ctrl.actions = lodash.chain(actions).filter(function (action) {
                    return !lodash.has(action, 'visible') || action.visible;
                }).map(function (action) {
                    if (!angular.isFunction(action.handler)) {
                        action.handler = defaultAction;

                        if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                            action.confirm = {
                                message: $i18next.t('common:DELETE_SELECTED_ITEM_CONFIRM', { lng: lng }),
                                yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                                noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                                type: 'critical_alert'
                            };
                        }
                    }

                    return action;
                }).value();
            }

            if (angular.isDefined(shortcuts)) {
                ctrl.shortcuts = lodash.filter(shortcuts, function (shortcut) {
                    return !lodash.has(shortcut, 'visible') || shortcut.visible;
                });
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            detachDocumentEvent();
        }

        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.menu-dropdown');

            attachDocumentEvent();
        }

        //
        // Public methods
        //

        /**
         * Handles mouse click on  a shortcut
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function showDetails(event, state) {
            if (angular.isFunction(ctrl.onClickShortcut)) {
                ctrl.onClickShortcut(event, state);
            }
        }

        /**
         * Handles mouse click on the button of menu
         * @param {Object} event
         * Show/hides the action dropdown
         */
        function toggleMenu(event) {
            if (!ctrl.isMenuShown) {
                $rootScope.$broadcast('close-all-action-menus');
                ctrl.isMenuShown = true;
                attachDocumentEvent();

                if (angular.isDefined(ctrl.listClass)) {
                    checkOpeningSide(ctrl.listClass);
                } else {
                    $timeout(function () {
                        angular.element('.menu-dropdown').css('visibility', 'visible');
                    });
                }
            } else {
                detachDocumentEvent();
                ctrl.isMenuShown = false;
            }

            event.stopPropagation();
        }

        /**
         * Checks if action menu is visible (not empty)
         */
        function isVisible() {
            return !lodash.isEmpty(ctrl.actions) || !lodash.isEmpty(ctrl.shortcuts);
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', onDocumentClick);
        }

        /**
         * Closes action menu
         */
        function closeActionMenu() {
            ctrl.isMenuShown = false;
            detachDocumentEvent();
        }

        /**
         * Default action handler
         * @param {Object} action
         */
        function defaultAction(action) {
            if (angular.isFunction(ctrl.onFireAction)) {
                ctrl.onFireAction(action.id);
            }
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', onDocumentClick);
        }

        /**
         * Closes action menu
         * @param {MouseEvent} event
         */
        function onDocumentClick(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    closeActionMenu();
                }
            });
        }

        /**
         * Checks how to open drop-down menu in key-value list
         * @param {string} elementClass - class of parental block of key-value list
         */
        function checkOpeningSide(elementClass) {
            var parentalBlock = $(document).find('.' + elementClass)[0];
            var parentalRect = parentalBlock.getBoundingClientRect();
            var dropdown;
            var dropdownBottom;

            $timeout(function () {
                dropdown = angular.element($element).find('.menu-dropdown')[0];
                dropdownBottom = dropdown.getBoundingClientRect().bottom;
                dropdown = angular.element(dropdown);
            });

            if (lodash.includes(elementClass, 'scrollable')) {
                var parentalHeight = parentalBlock.clientHeight;
                var parentalTop = parentalRect.top;

                $timeout(function () {
                    dropdownBottom - parentalTop > parentalHeight ? dropdown.addClass('upward-menu') : dropdown.css({ 'visibility': 'visible' });

                    angular.element('.' + elementClass + ' .mCSB_container').css({ 'height': 'auto' });
                });
            } else {
                var parentalBottom = parentalRect.bottom;

                $timeout(function () {
                    dropdownBottom > parentalBottom ? dropdown.addClass('upward-menu') : dropdown.css({ 'visibility': 'visible' });
                });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionPanel.$inject = ['$scope', '$rootScope', '$i18next', 'i18next', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('igzActionPanel', {
        bindings: {
            actions: '<',
            onItemsCheckedCount: '&?'
        },
        templateUrl: 'igz_controls/components/action-panel/action-panel.tpl.html',
        controller: IgzActionPanel,
        transclude: true
    });

    function IgzActionPanel($scope, $rootScope, $i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        var checkedItemsCount = 0;
        var mainActionsCount = 5;

        ctrl.mainActions = [];
        ctrl.remainActions = [];

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.isActionPanelShown = isActionPanelShown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('action-checkbox-all_checked-items-count-change', onUpdateCheckedItemsCount);
            $scope.$on('action-checkbox-all_check-all', onUpdateCheckedItemsCount);

            refreshActions();
        }

        /**
         * On changes hook method
         */
        function onChanges() {
            refreshActions();
        }

        //
        // Private methods
        //

        /**
         * Default action handler
         * @param {Object} action
         * @param {string} action.id - an action ID (e.g. delete, clone etc.)
         */
        function defaultAction(action) {
            $rootScope.$broadcast('action-panel_fire-action', {
                action: action.id
            });
        }

        /**
         * Checks whether the action panel can be shown
         * @returns {boolean}
         */
        function isActionPanelShown() {
            return checkedItemsCount > 0;
        }

        /**
         * Called when 'Check all' checkbox is clicked or checked some item.
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {Object} data.checkedCount - count of checked items
         */
        function onUpdateCheckedItemsCount(event, data) {
            checkedItemsCount = data.checkedCount;

            if (angular.isFunction(ctrl.onItemsCheckedCount)) {
                ctrl.onItemsCheckedCount({ checkedCount: checkedItemsCount });
            }

            var visibleActions = lodash.filter(ctrl.actions, ['visible', true]);

            ctrl.mainActions = lodash.slice(visibleActions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(visibleActions, mainActionsCount, visibleActions.length);
        }

        /**
         * Refreshes actions list
         */
        function refreshActions() {
            ctrl.actions = lodash.filter(ctrl.actions, function (action) {
                return !lodash.has(action, 'visible') || action.visible;
            });

            angular.forEach(ctrl.actions, function (action) {
                if (!angular.isFunction(action.handler)) {
                    action.handler = defaultAction;

                    if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                        action.confirm = {
                            message: $i18next.t('common:DELETE_SELECTED_ITEMS_CONFIRM', { lng: lng }),
                            yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                            noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                            type: 'critical_alert'
                        };
                    }
                }
            });
            ctrl.mainActions = lodash.slice(ctrl.actions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(ctrl.actions, mainActionsCount, ctrl.actions.length);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionsPanesController.$inject = ['lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('igzActionsPanes', {
        bindings: {
            infoPaneDisable: '<?',
            isInfoPaneOpened: '<?',
            filtersToggleMethod: '&?',
            filtersCounter: '<?',
            isFiltersOpened: '<?',
            showFilterIcon: '@?',
            infoPaneToggleMethod: '&?',
            closeInfoPane: '&?'
        },
        templateUrl: 'igz_controls/components/actions-panes/actions-panes.tpl.html',
        controller: IgzActionsPanesController
    });

    function IgzActionsPanesController(lodash, ConfigService) {
        var ctrl = this;

        ctrl.callToggleMethod = null;

        ctrl.$onInit = onInit;

        ctrl.isShowFilterActionIcon = isShowFilterActionIcon;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.callToggleMethod = angular.isFunction(ctrl.closeInfoPane) ? ctrl.closeInfoPane : ctrl.infoPaneToggleMethod;
        }

        //
        // Public method
        //

        /**
         * Checks if filter toggles method exists and if filter pane should toggle only in demo mode
         * @returns {boolean}
         */
        function isShowFilterActionIcon() {
            return angular.isFunction(ctrl.filtersToggleMethod) && (lodash.isEqual(ctrl.showFilterIcon, 'true') || ConfigService.isDemoMode());
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzCopyToClipboard.$inject = ['$i18next', 'i18next', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('igzCopyToClipboard', {
        bindings: {
            value: '<'
        },
        templateUrl: 'igz_controls/components/copy-to-clipboard/copy-to-clipboard.tpl.html',
        controller: IgzCopyToClipboard
    });

    function IgzCopyToClipboard($i18next, i18next, DialogsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.copyToClipboard = copyToClipboard;

        //
        // Public method
        //

        /**
         * Copies a string to the clipboard.
         */
        function copyToClipboard() {
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = ctrl.value;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();

                try {
                    return document.execCommand('copy'); // Security exception may be thrown by some browsers.
                } catch (ex) {
                    DialogsService.alert($i18next.t('common:COPY_TO_CLIPBOARD_FAILED', { lng: lng }), ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    /**
     * @name igzDefaultDropdown
     * @description
     * Default drop down component. This component is a toggleable menu that allows the user to choose one value from a
     * predefined list.
     *
     * @param {Object|string} selectedItem - an object/string to be set by the component.
     *     The value that will be set as selected item from predefined list.
     *     Note: if @param enableTyping is equal to true it means that the user can mutate this value. In this case
     *     after modifying the value the new list item will be created.
     * @param {Array.<Object>} valuesArray - an array of objects describing the available options that user can select.
     * @param {Object} bottomButtonCallback - callback on toggleable menu`s bottom button click.
     * @param {string} bottomButtonText - the text of the toggleable menu`s bottom button.
     * @param {string} dropdownType - type of the predefined dropdown (`badges-dropdown`, `priority`).
     * @param {boolean} enableTyping - set to `true` to allow typing new value in the collapsed dropdown input.
     * @param {boolean} enableOverlap - set to `true` to dropdown overlap the parental block (please set z-index for `.default-container` if it needed).
     * @param {Object} formObject - form object.
     * @param {string} inputName - name of the input.
     * @param {boolean} isDisabled - set to `true` to make this instance of the component read-only.
     * @param {boolean} isFocused - should input be focused when screen is displayed
     * @param {boolean} isCapitalized - set to `true` to make capitalized all text from listing and selected value.
     * @param {boolean} isPagination - set to `true` to remove check mark from selected list`s item.
     *     Note: only for pagination dropdown.
     * @param {boolean} isRequired - set to `true` to make required selection of a value.
     * @param {string} itemSelectField - name of the field that should be set from the selected value.
     * @param {Object} itemSelectCallback - callback on selecting item from a list.
     * @param {Object} matchPattern - pattern for validating typed value if enableTyping is `true`.
     * @param {string} nameKey - name of the list`s item which should be shown.
     * @param {Object} onOpenDropdown - callback on opening dropdown menu.
     * @param {Object} onCloseDropdown - callback on closing dropdown menu.
     * @param {boolean} readOnly - marked dropdown as `readonly`.
     * @param {boolean} preventDropUp - set to `true` to prevent drop up the menu.
     * @param {string} placeholder - text which should be shown if no value is selected.
     * @param {string} selectPropertyOnly - name of the property which should be set to selectedItem.
     *     Note: in that case ctrl.selectedItem will be a string value
     * @param {boolean} skipSelection - make the dropdown unselectable. On selecting any item, dropdown doesn't select
     *     it, and always shows placeholder..
     */

    IgzDefaultDropdownController.$inject = ['$scope', '$element', '$document', '$timeout', '$transclude', '$window', 'lodash', 'EventHelperService', 'FormValidationService', 'PreventDropdownCutOffService', 'PriorityDropdownService', 'SeverityDropdownService'];
    angular.module('iguazio.dashboard-controls').component('igzDefaultDropdown', {
        bindings: {
            additionalClass: '@?',
            selectedItem: '<',
            valuesArray: '<',
            bottomButtonCallback: '<?',
            bottomButtonText: '@?',
            dropdownType: '@?',
            enableTyping: '<?',
            enableOverlap: '<?',
            formObject: '<?',
            iconClass: '@?',
            inputName: '@?',
            isDisabled: '<?',
            isFocused: '<?',
            isCapitalized: '@?',
            isPagination: '<?',
            isRequired: '<?',
            itemSelectField: '@?',
            itemSelectCallback: '&?',
            matchPattern: '<?',
            nameKey: '@?',
            onOpenDropdown: '<?',
            onCloseDropdown: '&?',
            readOnly: '<?',
            preventDropUp: '<?',
            placeholder: '@?',
            selectPropertyOnly: '@?',
            skipSelection: '<?'
        },
        templateUrl: 'igz_controls/components/default-dropdown/default-dropdown.tpl.html',
        transclude: true,
        controller: IgzDefaultDropdownController
    });

    function IgzDefaultDropdownController($scope, $element, $document, $timeout, $transclude, $window, lodash, EventHelperService, FormValidationService, PreventDropdownCutOffService, PriorityDropdownService, SeverityDropdownService) {
        var ctrl = this;

        ctrl.topPosition = 'inherit';
        ctrl.typedValue = '';
        ctrl.isDropdownContainerShown = false;
        ctrl.isDropUp = false;
        ctrl.selectedItemDescription = '';
        ctrl.isTranscludePassed = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.checkIsRequired = checkIsRequired;
        ctrl.getDescription = getDescription;
        ctrl.getName = getName;
        ctrl.getIcon = getIcon;
        ctrl.getTooltip = getTooltip;
        ctrl.getValuesArray = getValuesArray;
        ctrl.isItemSelected = isItemSelected;
        ctrl.isPlaceholderClass = isPlaceholderClass;
        ctrl.isShowDropdownError = isShowDropdownError;
        ctrl.onChangeTypingInput = onChangeTypingInput;
        ctrl.onDropDownKeydown = onDropDownKeydown;
        ctrl.onItemKeydown = onItemKeydown;
        ctrl.selectItem = selectItem;
        ctrl.showSelectedItem = showSelectedItem;
        ctrl.toggleDropdown = toggleDropdown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isCapitalized = lodash.defaultTo(ctrl.isCapitalized, 'false').toLowerCase() === 'true';
            ctrl.iconClass = lodash.defaultTo(ctrl.iconClass, 'igz-icon-dropdown');

            if (!lodash.isNil(ctrl.dropdownType) && ctrl.dropdownType === 'priority') {
                ctrl.valuesArray = PriorityDropdownService.getPrioritiesArray();
            }

            if (!lodash.isNil(ctrl.dropdownType) && ctrl.dropdownType === 'severity') {
                ctrl.valuesArray = SeverityDropdownService.getSeveritiesArray();
            }

            setDefaultInputValue();

            setDefaultPlaceholder();

            setEmptyObjectIfNullSelected();

            setValuesVisibility();

            if (ctrl.enableOverlap) {
                resizeDropdownContainer();
                angular.element($window).on('resize', resizeDropdownContainer);
            }

            // checks if transclude template was passed
            $transclude(function (transclude) {
                ctrl.isTranscludePassed = transclude.length > 0;
            });

            // set focus (for using keyboard) if ctrl.isFocused is true
            $timeout(function () {
                if (ctrl.isFocused) {
                    $element.find('.default-dropdown-field').first().focus();
                }
            });

            $scope.$on('close-drop-down', unselectDropdown);
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.selectedItem)) {
                if (!changes.selectedItem.isFirstChange()) {
                    setDefaultInputValue();
                }
            }

            if (angular.isDefined(changes.valuesArray)) {
                if (!changes.valuesArray.isFirstChange()) {
                    setDefaultInputValue();
                }
            }
        }

        /**
         * Post linking method
         */
        function postLink() {
            if (!ctrl.enableOVerlap) {
                PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
            }
            $document.on('click', unselectDropdown);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', unselectDropdown);
            angular.element($window).off('resize', resizeDropdownContainer);
        }

        //
        // Public methods
        //

        /**
         * Sets required flag
         */
        function checkIsRequired() {
            return Boolean(ctrl.isRequired);
        }

        /**
         * Returns the description of the provided item. Searches for a direct `description` property, or a
         * `description` property inside an `attr` property
         * @param {Object} item - the item whose description should be returned
         * @returns {string}
         */
        function getDescription(item) {
            return lodash.get(item, 'description', lodash.get(item, 'attr.description'), '');
        }

        /**
         * Returns the tooltip of the provided item
         * @param {Object} item - the item whose tooltip should be returned
         * @returns {string}
         */
        function getTooltip(item) {
            return lodash.get(item, 'tooltip', '');
        }

        /**
         * Returns the icon of the provided item.
         * @param {Object} item - the item whose icon should be returned
         * @returns {string}
         */
        function getIcon(item) {
            return lodash.get(item, 'icon', '');
        }

        /**
         * Returns the name of the provided item. Searches for a direct `name` property, or searches `name` property by
         * `nameKey`
         * @param {Object} item - the item whose name should be returned
         * @returns {string}
         */
        function getName(item) {
            return lodash.get(item, 'name', lodash.get(item, ctrl.nameKey, ''));
        }

        /**
         * Gets array of available values
         * @returns {Array}
         */
        function getValuesArray() {
            return ctrl.valuesArray;
        }

        /**
         * Determines whether current item selected
         * @param {Object} item - current item
         * @returns {boolean}
         */
        function isItemSelected(item) {
            return angular.isDefined(ctrl.selectPropertyOnly) ? ctrl.selectedItem === lodash.get(item, ctrl.selectPropertyOnly) : lodash.isEqual(ctrl.selectedItem, item);
        }

        /**
         * Checks if placeholder class should be set on input field
         * @returns {boolean}
         */
        function isPlaceholderClass() {
            return angular.isDefined(ctrl.selectPropertyOnly) ? ctrl.selectedItem === null : ctrl.selectedItem.id === null;
        }

        /**
         * Checks whether show error if custom dropdown is invalid or on whole form validation (on submit, tab switch)
         * @param {Object} form
         * @param {string} elementName
         * @returns {boolean|undefined}
         */
        function isShowDropdownError(form, elementName) {
            return ctrl.isRequired ? FormValidationService.isShowFieldInvalidState(form, elementName) : undefined;
        }

        /**
         * Changes selected item depending on typed value
         */
        function onChangeTypingInput() {
            if (!lodash.isNil(ctrl.typedValue)) {
                var newItem = {
                    id: ctrl.typedValue,
                    visible: true
                };
                lodash.set(newItem, ctrl.nameKey || 'name', ctrl.typedValue);

                ctrl.selectItem(lodash.find(ctrl.valuesArray, ['name', ctrl.typedValue]) || newItem);
            }
        }

        /**
         * Handles keydown events on dropdown
         * @param {Object} event
         */
        function onDropDownKeydown(event) {
            switch (event.keyCode) {
                case EventHelperService.UP:
                case EventHelperService.DOWN:
                    if (!ctrl.isDropdownContainerShown) {
                        ctrl.isDropdownContainerShown = true;
                    }
                    var firstListItem = $element.find('.default-dropdown-container .list-item').first();
                    firstListItem.focus();
                    break;
                case EventHelperService.TABKEY:
                    ctrl.isDropdownContainerShown = false;
                    break;
                case EventHelperService.SPACE:
                case EventHelperService.ENTER:
                    ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;
                    break;
                default:
                    break;
            }
            event.stopPropagation();
        }

        /**
         * Handles keydown events on dropdown items
         * @param {Object} event
         * @param {Object} item - current item
         */
        function onItemKeydown(event, item) {
            var dropdownField = $element.find('.default-dropdown-field').first();
            switch (event.keyCode) {
                case EventHelperService.UP:
                    if (!lodash.isNull(event.target.previousElementSibling)) {
                        event.target.previousElementSibling.focus();
                        event.stopPropagation();
                    }
                    break;
                case EventHelperService.DOWN:
                    if (!lodash.isNull(event.target.nextElementSibling)) {
                        event.target.nextElementSibling.focus();
                        event.stopPropagation();
                    }
                    break;
                case EventHelperService.SPACE:
                case EventHelperService.ENTER:
                    dropdownField.focus();
                    ctrl.selectItem(item, event);
                    break;
                case EventHelperService.ESCAPE:
                case EventHelperService.TABKEY:
                    dropdownField.focus();
                    ctrl.isDropdownContainerShown = false;
                    break;
                default:
                    break;
            }
            event.preventDefault();
            event.stopPropagation();
        }

        function resizeDropdownContainer() {
            var dropdown = $element.find('.default-dropdown-field')[0];
            var dropdownWidth = lodash.get(window.getComputedStyle(dropdown), 'width');

            angular.element($element.find('.default-dropdown-container')[0]).css('width', dropdownWidth);
        }

        /**
         * Sets current item as selected
         * @param {Object} item - current item
         * @param {Object} event
         */
        function selectItem(item, event) {
            if (!item.disabled) {
                var previousItem = angular.copy(ctrl.selectedItem);

                if (!ctrl.skipSelection) {
                    if (angular.isDefined(ctrl.selectPropertyOnly)) {
                        ctrl.selectedItem = lodash.get(item, ctrl.selectPropertyOnly);
                        ctrl.selectedItemDescription = item.description;
                    } else {
                        ctrl.selectedItem = item;
                    }
                    ctrl.typedValue = ctrl.getName(item);
                }

                if (angular.isFunction(ctrl.itemSelectCallback)) {
                    $timeout(function () {
                        ctrl.itemSelectCallback({
                            item: item,
                            isItemChanged: !lodash.isEqual(previousItem, ctrl.selectedItem),
                            field: angular.isDefined(ctrl.itemSelectField) ? ctrl.itemSelectField : null
                        });
                    });
                }

                ctrl.isDropdownContainerShown = false;
            }
            if (!lodash.isNil(event)) {
                event.stopPropagation();
            }
        }

        /**
         * Displays selected item name in dropdown. If model is set to null, set default object
         * @returns {string}
         */
        function showSelectedItem() {
            if (!ctrl.selectedItem) {
                setEmptyObjectIfNullSelected();
                ctrl.hiddenInputValue = '';
            }

            if (angular.isDefined(ctrl.selectPropertyOnly) && angular.isDefined(ctrl.valuesArray)) {

                // Set description for selected item
                var selectedItemUiValue = lodash.find(ctrl.valuesArray, function (item) {
                    return lodash.get(item, ctrl.selectPropertyOnly) === ctrl.selectedItem;
                });

                ctrl.selectedItemDescription = lodash.get(selectedItemUiValue, 'description', null);

                // Return temporary object used for selected item name displaying on UI input field
                return {
                    name: lodash.get(selectedItemUiValue, 'name', lodash.get(selectedItemUiValue, ctrl.nameKey, ctrl.placeholder)),
                    icon: {
                        name: lodash.get(selectedItemUiValue, 'icon.name', ''),
                        class: lodash.get(selectedItemUiValue, 'icon.class', '')
                    },
                    description: ctrl.selectedItemDescription
                };
            }
            return ctrl.selectedItem;
        }

        /**
         * Shows dropdown element
         * @params {Object} $event
         */
        function toggleDropdown($event) {
            var dropdownContainer = $event.currentTarget;
            var buttonHeight = dropdownContainer.getBoundingClientRect().height;
            var position = dropdownContainer.getBoundingClientRect().top;
            var positionLeft = dropdownContainer.getBoundingClientRect().left;

            ctrl.isDropUp = false;

            if (angular.isUndefined(ctrl.preventDropUp) || !ctrl.preventDropUp) {
                if (!ctrl.isDropdownContainerShown) {
                    $timeout(function () {
                        var dropdownMenu = $element.find('.default-dropdown-container');
                        var menuHeight = dropdownMenu.height();

                        if (position > menuHeight && $window.innerHeight - position < buttonHeight + menuHeight) {
                            ctrl.isDropUp = true;
                            ctrl.topPosition = -menuHeight + 'px';
                        } else {
                            ctrl.isDropUp = false;
                            ctrl.topPosition = 'inherit';
                        }

                        if ($window.innerWidth - positionLeft < dropdownMenu.width()) {
                            dropdownMenu.css('right', '0');
                        }
                    });
                }
            }
            ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;

            if (ctrl.isDropdownContainerShown) {
                setValuesVisibility();

                $timeout(function () {
                    setWidth();

                    if (angular.isFunction(ctrl.onOpenDropdown)) {
                        ctrl.onOpenDropdown($element);
                    }

                    if (ctrl.enableOverlap) {
                        resizeDropdownContainer();
                    }
                });

                if (!ctrl.enableOverlap) {
                    PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
                }
            } else {
                if (angular.isFunction(ctrl.onCloseDropdown)) {
                    ctrl.onCloseDropdown();
                }
            }
        }

        //
        // Private methods
        //

        /**
         * Sets default input value
         */
        function setDefaultInputValue() {
            if (!lodash.isNil(ctrl.selectedItem)) {
                ctrl.typedValue = ctrl.getName(angular.isDefined(ctrl.selectPropertyOnly) ? lodash.find(ctrl.valuesArray, [ctrl.selectPropertyOnly, ctrl.selectedItem]) : ctrl.selectedItem);

                if (ctrl.typedValue === '' && ctrl.enableTyping) {
                    ctrl.typedValue = ctrl.selectedItem;
                }
            }
        }

        /**
         * Sets default placeholder for drop-down if it's value is not defined
         */
        function setDefaultPlaceholder() {
            if (!ctrl.placeholder) {
                ctrl.placeholder = 'Please select...';
            }
        }

        /**
         * Sets default empty value if any other object has not been defined earlier
         */
        function setEmptyObjectIfNullSelected() {
            if (!ctrl.selectedItem) {
                ctrl.selectedItem = angular.isDefined(ctrl.selectPropertyOnly) ? null : {
                    id: null,
                    name: null
                };
            }
        }

        /**
         * Sets `visible` property for all array items into true if it is not already defined.
         * `visible` property determines whether item will be shown in drop-down list.
         */
        function setValuesVisibility() {
            lodash.forEach(ctrl.valuesArray, function (value) {
                lodash.defaults(value, { visible: true });
            });
        }

        /**
         * Handle click on the document and not on the dropdown field and close the dropdown
         * @param {Object} e - event
         */
        function unselectDropdown(e) {
            if ($element.find(e.target).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.isDropdownContainerShown = false;
                    ctrl.isDropUp = false;

                    if (angular.isFunction(ctrl.onCloseDropdown)) {
                        ctrl.onCloseDropdown();
                    }
                });
            }
        }

        /**
         * Takes the largest element and sets him width as min-width to all elements (needed to style drop-down list)
         */
        function setWidth() {
            var labels = $element.find('.default-dropdown-container ul li').find('.list-item-label');
            var minWidth = lodash(labels).map(function (label) {
                return angular.element(label)[0].clientWidth;
            }).min();

            lodash.forEach(labels, function (label) {
                angular.element(label).css('min-width', minWidth);
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzElasticInputFieldController.$inject = ['lodash', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzElasticInputField', {
        bindings: {
            inputName: '@',
            formObject: '<',
            model: '<',
            modelOptions: '<',
            maxLength: '<',
            minLength: '<',
            pattern: '<',
            placeholder: '@?',
            required: '<',
            trim: '@',
            onChange: '&?',
            readOnly: '<?'
        },
        templateUrl: 'igz_controls/components/elastic-input-field/elastic-input-field.tpl.html',
        controller: IgzElasticInputFieldController
    });

    function IgzElasticInputFieldController(lodash, FormValidationService) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.onDataChange = onDataChange;

        //
        // Hook method
        //
        function onInit() {
            ctrl.readOnly = lodash.defaultTo(ctrl.readOnly, false);
        }

        //
        // Public method
        //

        /**
         * Calls onDataChange method if it was set
         */
        function onDataChange() {
            if (angular.isFunction(ctrl.onChange)) {
                ctrl.onChange({ item: ctrl.model });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzMoreInfoController.$inject = ['$document', '$element', '$timeout', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('igzMoreInfo', {
        bindings: {
            description: '@',
            isDisabled: '<?',
            trigger: '@?',
            isHtmlEnabled: '<?',
            isDefaultTooltipEnabled: '<?',
            defaultTooltipPlacement: '@?',
            defaultTooltipPopupDelay: '@?'
        },
        templateUrl: 'igz_controls/components/more-info/more-info.tpl.html',
        controller: IgzMoreInfoController
    });

    function IgzMoreInfoController($document, $element, $timeout, lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.isClickMode = isClickMode;
        ctrl.onQuestionMarkClick = onQuestionMarkClick;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                isDisabled: false,
                isHtmlEnabled: false,
                isDefaultTooltipEnabled: false,
                defaultTooltipPlacement: 'auto',
                defaultTooltipPopupDelay: '0'
            });

            // Defaults trigger method to 'mouseenter'. Available 2 modes: `hover (mouseenter)` and `click`.
            if (ctrl.trigger !== 'click') {
                ctrl.trigger = 'mouseenter';
            }

            // In `click` mode this variable is responsible for displaying tooltip.
            // If it is `true` tooltip is shown and hidden otherwise. Toggles by `onQuestionMarkClick` only in this mode.
            // In `hover` mode is always `true`.
            ctrl.isDescriptionVisible = !isClickMode();
        }

        //
        // Public methods
        //

        /**
         * Determine whether the trigger method is `click`
         * @returns {boolean}
         */
        function isClickMode() {
            return ctrl.trigger === 'click';
        }

        /**
         * Handles click on question mark. Shows/hides tooltip. Works only for 'click' trigger.
         */
        function onQuestionMarkClick() {
            if (ctrl.isClickMode()) {
                ctrl.isDescriptionVisible = !ctrl.isDescriptionVisible;

                $timeout(function () {
                    ctrl.isDescriptionVisible ? $document.on('click', hideTooltip) : $document.off('click', hideTooltip);
                });
            }
        }

        //
        // Private methods
        //

        /**
         * Hides tooltip by clicking anywhere outside of the tooltip or the question mark icon.
         * @param {Event} event
         */
        function hideTooltip(event) {
            if (!event.target.closest('.row-description') && $element.find('.question-mark')[0] !== event.target) {
                ctrl.isDescriptionVisible = false;

                $document.off('click', hideTooltip);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzNumberInputController.$inject = ['$timeout', '$element', 'lodash', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzNumberInput', {
        bindings: {
            currentValue: '<',
            valueStep: '@',
            allowEmptyField: '<?',
            currentValueUnit: '<?',
            defaultValue: '<?',
            formObject: '<?',
            inputName: '@?',
            isDisabled: '<?',
            isFocused: '<?',
            itemBlurCallback: '&?',
            itemFocusCallback: '&?',
            maxValue: '<?',
            minValue: '<?',
            onChange: '<?',
            placeholder: '@?',
            precision: '@?',
            prefixUnit: '@?',
            suffixUnit: '@?',
            updateNumberInputCallback: '&?',
            updateNumberInputField: '@?',
            validationIsRequired: '<?',
            validationValue: '<?',
            validationValueUnit: '<?'
        },
        templateUrl: 'igz_controls/components/number-input/number-input.tpl.html',
        controller: IgzNumberInputController
    });

    /**
     * IGZ number input
     * Based on `angular-money-directive` directive:
     * https://github.com/fiestah/angular-money-directive
     * Bindings properties:
     * currentValue - current value
     * valueStep - increment/decrement step
     * allowEmptyField - checks if true, then input field can be empty on initialization and
     *                   there is an ability to call updateNumberInputCallback with empty value
     * currentValueUnit - unit of current value
     * defaultValue - default value which will be set if field is empty
     * formObject - form object
     * inputName - name of input
     * isDisabled - checks if true, then input is disabled
     * isFocused - checks if true, then input is focused
     * maxValue - maximum legal value
     * minValue - minimum legal value
     * itemBlurCallback: callback for onBlur event
     * itemFocusCallback: callback for onFocus event
     * onChange - method on item changed
     * placeholder - placeholder text
     * precision - precision of value, ex. if precision is equal to 2 means that value will be in the form `X.XX`(ex. 2.11)
     * prefixUnit - prefix unit
     * suffixUnit - suffix unit
     * updateNumberInputCallback - callback on item added
     * updateNumberInputField - name of field that will be changed
     * validationIsRequired - checks if true, then input field is required(marked it as invalid)
     * validationValue - validation value
     * validationValueUnit - validation value unit
     */
    function IgzNumberInputController($timeout, $element, lodash, FormValidationService) {
        var ctrl = this;

        var firstValidValue;

        ctrl.numberInputChanged = false;
        ctrl.numberInputValid = true;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.checkInvalidation = checkInvalidation;
        ctrl.decreaseValue = decreaseValue;
        ctrl.increaseValue = increaseValue;
        ctrl.isShownUnit = isShownUnit;
        ctrl.onBlurInput = onBlurInput;
        ctrl.onChangeInput = onChangeInput;
        ctrl.onUnitClick = onUnitClick;
        ctrl.setFocus = setFocus;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl, {
                validationIsRequired: false,
                allowEmptyField: false,
                defaultValue: null,
                minValue: -Infinity,
                maxValue: Infinity,
                precision: lodash.defaultTo(Number(ctrl.precision), 0),
                placeholder: ''
            });

            if (lodash.isNil(ctrl.currentValue) && !lodash.isNil(ctrl.defaultValue)) {
                ctrl.currentValue = ctrl.defaultValue;
            }

            firstValidValue = Math.max(ctrl.minValue, ctrl.maxValue) < 0 ? ctrl.maxValue : ctrl.minValue;
        }

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.inputFocused = ctrl.isFocused === 'true';

            if (ctrl.isFocused === 'true') {
                $element.find('.field')[0].focus();
            }
        }

        //
        // Public methods
        //

        /**
         * Checks if the input value is invalid
         * @returns {boolean}
         */
        function checkInvalidation() {
            if (angular.isDefined(ctrl.formObject) && angular.isDefined(ctrl.formObject[ctrl.inputName])) {
                if ((lodash.isNil(ctrl.currentValue) || ctrl.currentValue === '') && ctrl.validationIsRequired) {
                    ctrl.formObject[ctrl.inputName].$setValidity('text', false);
                } else {
                    ctrl.formObject[ctrl.inputName].$setValidity('text', true);
                }
            }

            return ctrl.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName);
        }

        /**
         * Method subtracts value from current value in input
         */
        function decreaseValue() {
            var nextValue = isCurrentValueEmpty() ? -Number(ctrl.valueStep) : -Number(ctrl.valueStep) + Number(ctrl.currentValue);

            // when input is empty set firstValidValue
            ctrl.currentValue = lodash.defaultTo(getDecreasedValue(nextValue), firstValidValue);

            renderInput(ctrl.currentValue !== nextValue);
        }

        /**
         * Method adds value to current value in input
         */
        function increaseValue() {
            var nextValue = isCurrentValueEmpty() ? Number(ctrl.valueStep) : Number(ctrl.valueStep) + Number(ctrl.currentValue);

            // when input is empty set firstValidValue
            ctrl.currentValue = lodash.defaultTo(getIncreasedValue(nextValue), firstValidValue);

            renderInput(ctrl.currentValue !== nextValue);
        }

        /**
         * Method checks if passed value is defined
         * @param {string} [unitValue] - passed string unit value
         * @returns {boolean} returns true if defined
         */
        function isShownUnit(unitValue) {
            return angular.isDefined(unitValue);
        }

        /**
         * Handles on change event
         */
        function onChangeInput() {
            ctrl.numberInputChanged = true;
            onCurrentValueChange();

            if (lodash.isNil(ctrl.currentValue) && !lodash.isNull(ctrl.defaultValue) && !ctrl.allowEmptyField) {
                ctrl.currentValue = ctrl.defaultValue;
            }
        }

        /**
         * On unit click callback
         * Sets focus on input.
         */
        function onUnitClick() {
            $element.find('input')[0].focus();

            ctrl.setFocus();
        }

        /**
         * Sets ctrl.inputFocused to true if input is focused
         */
        function setFocus() {
            ctrl.inputFocused = true;

            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback({ inputName: ctrl.inputName });
            }
        }

        /**
         * Handles on blur event
         */
        function onBlurInput() {
            ctrl.inputFocused = false;

            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemBlurCallback({ inputName: ctrl.inputName });
            }

            onCurrentValueChange();
        }

        //
        // Private methods
        //

        /**
         * Checks if `nextValue` is inside the range [ctrl.minValue, ctrl.maxValue].
         * Returns valid value.
         * @param {number} nextValue
         * @returns {number|null}
         */
        function getDecreasedValue(nextValue) {
            var validValue = ctrl.currentValue;

            // range is [ctrl.minValue, ctrl.maxValue]
            if (lodash.inRange(nextValue, ctrl.minValue, ctrl.maxValue)) {
                // nextValue is inside range --> valid --> nextValue
                validValue = nextValue;
            } else if (lodash.inRange(nextValue, ctrl.maxValue, Infinity)) {
                // nextValue is to right of the range --> not valid --> end of range
                validValue = ctrl.maxValue;
            } else if (lodash.inRange(nextValue, ctrl.minValue, ctrl.minValue - Number(ctrl.valueStep))) {
                // nextValue is to left of the range, but not more then ctrl.valueStep --> not valid --> start of range
                validValue = ctrl.minValue;
            }

            // other cases --> nothing changes
            // when input is empty, ctrl.currentValue is null --> return null

            return validValue;
        }

        /**
         * Checks if `nextValue` is inside the range [ctrl.minValue, ctrl.maxValue].
         * Returns valid value.
         * @param {number} nextValue
         * @returns {number|null}
         */
        function getIncreasedValue(nextValue) {
            var validValue = ctrl.currentValue;

            // range is [ctrl.minValue, ctrl.maxValue]
            if (lodash.inRange(nextValue, ctrl.minValue, ctrl.maxValue)) {
                // nextValue is inside range --> valid --> nextValue
                validValue = nextValue;
            } else if (lodash.inRange(nextValue, -Infinity, ctrl.minValue)) {
                // nextValue is to the left of the range --> not valid --> start of range
                validValue = ctrl.minValue;
            } else if (lodash.inRange(nextValue, ctrl.maxValue, ctrl.maxValue + Number(ctrl.valueStep))) {
                // nextValue is to right of the range, but not more then ctrl.valueStep --> not valid --> end of range
                validValue = ctrl.maxValue;
            }

            // other cases --> nothing changes
            // when input is empty, ctrl.currentValue is null --> return null

            return validValue;
        }

        /**
         * Checks if current value is empty (empty input)
         * @returns {boolean}
         */
        function isCurrentValueEmpty() {
            return lodash.isNil(ctrl.currentValue) || ctrl.currentValue === '';
        }

        /**
         * Handles any changes of current value
         */
        function onCurrentValueChange() {
            validateCurrentValue();
            $timeout(function () {
                lodash.get(ctrl, 'onChange', angular.noop)(ctrl.checkInvalidation());
            });
        }

        /**
         * Set new value after increase/decrease to input and render it
         * @param {boolean} focus. Whether focus input.
         */
        function renderInput(focus) {
            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(Number(ctrl.currentValue).toFixed(ctrl.precision));
                ctrl.formObject[ctrl.inputName].$render();
                if (focus) {
                    $element.find('input').focus();
                }
            }
        }

        /**
         * Resets the input to default value if it is invalid
         */
        function validateCurrentValue() {
            if (angular.isFunction(ctrl.updateNumberInputCallback)) {
                if (ctrl.allowEmptyField || !lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '') {
                    ctrl.updateNumberInputCallback({
                        newData: !lodash.isNil(ctrl.currentValue) && ctrl.currentValue !== '' ? Number(ctrl.currentValue) : '',
                        field: angular.isDefined(ctrl.updateNumberInputField) ? ctrl.updateNumberInputField : ctrl.inputName
                    });
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    SearchHelperService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('SearchHelperService', SearchHelperService);

    function SearchHelperService(lodash) {
        return {
            makeSearch: makeSearch
        };

        //
        // Public methods
        //

        /**
         * Perform search of data based on text query
         * @param {string} searchQuery - text query entered to a search input
         * @param {Array.<Object>} data - array of data
         * @param {Array.<string>} pathsForSearchArray - array of keys in which search will be made
         * @param {boolean} isHierarchical - flag which indicates if passed data has hierarchical structure
         * @param {string} ruleType - string representing the type of rule resource
         * @param {Object} searchStates
         */
        function makeSearch(searchQuery, data, pathsForSearchArray, isHierarchical, ruleType, searchStates) {
            searchStates.searchNotFound = false;
            searchStates.searchInProgress = false;

            if (isHierarchical) {
                data = data.ui.children;
            } else {
                ruleType = '';
            }
            if (searchQuery === '') {
                showAllChildren(data);
            } else if (angular.isString(searchQuery)) {
                searchStates.searchNotFound = true;
                searchStates.searchInProgress = true;
                findBySearchQuery(searchQuery, data, pathsForSearchArray, isHierarchical, ruleType, searchStates);
            }
        }

        //
        // Private methods
        //

        /**
         * Loop through all given data to show/hide them depending on query match criteria (recursively)
         * @param {string} searchQuery - text query entered to a search input
         * @param {Array.<Object>} children - array of child data
         * @param {Array.<string>} pathsForSearch - array of strings, representing data's properties keys to search from
         * @param {boolean} isHierarchical - flag which indicates if passed data has hierarchical structure
         * @param {string} ruleType - string representing the type of rule resource
         * @param {Object} searchStates
         */
        function findBySearchQuery(searchQuery, children, pathsForSearch, isHierarchical, ruleType, searchStates) {
            angular.forEach(children, function (child) {
                // Search by text in data without children data only
                if (angular.isString(child.type) && child.type !== ruleType && isHierarchical) {
                    // Hide all parent data while search among children and proceed recursively
                    child.ui.isFitQuery = false;
                    findBySearchQuery(searchQuery, child.ui.children, pathsForSearch, isHierarchical, ruleType, searchStates);
                } else {
                    showRelevantItem(searchQuery, child, pathsForSearch, searchStates);
                }
            });
        }

        /**
         * Loop through all given data's properties and show/hide current data depending on query match criteria
         * @param {string} searchQuery - query entered to a search input
         * @param {Object} dataItem - current item
         * @param {Array} pathsForSearch - array of strings, representing paths to item's properties to search from
         * @param {Object} searchStates
         */
        function showRelevantItem(searchQuery, dataItem, pathsForSearch, searchStates) {
            var stringValuesArray = [];

            angular.forEach(pathsForSearch, function (pathForSearch) {
                getStringValuesFromItem(lodash.get(dataItem, pathForSearch), stringValuesArray);
            });

            // If at least one value in item's properties string values matched - show current item and all its direct ancestors chain
            dataItem.ui.isFitQuery = stringValuesArray.some(function (value) {
                return lodash.includes(value.toLowerCase(), searchQuery.toLowerCase());
            });

            if (dataItem.ui.isFitQuery) {
                searchStates.searchNotFound = false;
                showAllParents(dataItem);
            }
        }

        /**
         * Get all current item's properties string values and push to stringValuesArray (recursively)
         * @param {string} itemPropertyValue - item's attribute value
         * @param {Array} stringValuesArray - array to collect current item's all properties string values
         */
        function getStringValuesFromItem(itemPropertyValue, stringValuesArray) {
            if (angular.isObject(itemPropertyValue)) {
                angular.forEach(itemPropertyValue, function (value) {
                    getStringValuesFromItem(value, stringValuesArray);
                });
            } else if (angular.isString(itemPropertyValue) && itemPropertyValue.length > 0 || angular.isNumber(itemPropertyValue)) {
                stringValuesArray.push(itemPropertyValue.toString());
            }

            return stringValuesArray;
        }

        /**
         * Show item's all direct ancestors chain (recursively)
         * @param {Object} dataItem - current item
         */
        function showAllParents(dataItem) {
            var parent = dataItem.ui.parent;
            if (angular.isDefined(parent)) {
                parent.ui.isFitQuery = true;
                showAllParents(parent);
            }
        }

        /**
         * Show all data item's children chain (recursively)
         * @param {Array.<Object>} data - child items
         */
        function showAllChildren(data) {
            angular.forEach(data, function (value) {
                var children = value.ui.children;
                value.ui.isFitQuery = true;
                if (!lodash.isEmpty(children)) {
                    showAllChildren(children);
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzSearchInputController.$inject = ['$scope', '$timeout', 'lodash', 'SearchHelperService'];
    angular.module('iguazio.dashboard-controls').component('igzSearchInput', {
        bindings: {
            dataSet: '<',
            isSearchHierarchically: '@?',
            liveSearch: '<?',
            onSearchSubmit: '&?',
            placeholder: '@',
            ruleType: '@?',
            searchCallback: '&?',
            searchKeys: '<',
            searchStates: '<',
            searchType: '@?',
            type: '@?'
        },
        templateUrl: 'igz_controls/components/search-input/search-input.tpl.html',
        controller: IgzSearchInputController
    });

    function IgzSearchInputController($scope, $timeout, lodash, SearchHelperService) {
        var ctrl = this;

        ctrl.isInputFocused = false;
        ctrl.isSearchHierarchically = String(ctrl.isSearchHierarchically) === 'true';
        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;
        ctrl.onPressEnter = onPressEnter;
        ctrl.clearInputField = clearInputField;
        ctrl.toggleInputFocus = toggleInputFocus;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.searchStates.searchNotFound = false;
            ctrl.searchStates.searchInProgress = false;

            if (angular.isUndefined(ctrl.searchType)) {
                ctrl.searchType = 'infoPage';
            }

            if (angular.isUndefined(ctrl.liveSearch) || ctrl.liveSearch) {
                $scope.$watch('$ctrl.searchQuery', onChangeSearchQuery);
            }

            $scope.$on('search-input_refresh-search', onDataChanged);
            $scope.$on('search-input_reset', resetSearch);
        }

        //
        // Public methods
        //

        /**
         * Initializes search and apply filters on press enter
         * @param {Event} e
         */
        function onPressEnter(e) {
            if (e.keyCode === 13) {
                makeSearch();

                if (angular.isFunction(ctrl.onSearchSubmit) && ctrl.isInputFocused) {
                    ctrl.onSearchSubmit();
                }
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.searchQuery = '';
        }

        /**
         * Toggles input focus
         */
        function toggleInputFocus() {
            ctrl.isInputFocused = !ctrl.isInputFocused;
        }

        //
        // Private methods
        //

        /**
         * Calls service method for search
         */
        function makeSearch() {
            if (angular.isFunction(ctrl.searchCallback)) {

                // call custom search method
                ctrl.searchCallback(lodash.pick(ctrl, ['searchQuery', 'dataSet', 'searchKeys', 'isSearchHierarchically', 'ruleType', 'searchStates']));
            }

            if (angular.isUndefined(ctrl.type)) {

                // default search functionality
                SearchHelperService.makeSearch(ctrl.searchQuery, ctrl.dataSet, ctrl.searchKeys, ctrl.isSearchHierarchically, ctrl.ruleType, ctrl.searchStates);
            }
        }

        /**
         * Tracks input changing and initializes search
         */
        function onChangeSearchQuery(newValue, oldValue) {
            if (angular.isDefined(newValue) && newValue !== oldValue) {
                makeSearch();
            }
        }

        /**
         * Initializes search when all html has been rendered
         */
        function onDataChanged() {
            $timeout(makeSearch);
        }

        /**
         * Resets search query and initializes search
         */
        function resetSearch() {
            ctrl.searchQuery = '';
            $timeout(makeSearch);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').directive('igzShowHideSearchItem', igzShowHideSearchItem);

    function igzShowHideSearchItem() {
        return {
            restrict: 'A',
            scope: {
                dataItem: '=igzShowHideSearchItem'
            },
            link: link
        };

        function link(scope, element) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                scope.$watch('dataItem.ui.isFitQuery', changeVisibility);
            }

            /**
             * Method sets display property of element to false if it doesn't fit the query in search otherwise removes these property
             * @param {boolean} newValue - value displays if current element fit search query
             */
            function changeVisibility(newValue) {
                var displayValue = newValue === false ? 'none' : '';
                element.css('display', displayValue);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzPaginationController.$inject = ['$scope', '$timeout', 'lodash', 'EventHelperService', 'LocalStorageService', 'PaginationService'];
    angular.module('iguazio.dashboard-controls').component('igzPagination', {
        bindings: {
            entityName: '@?',
            pageData: '<',
            paginationCallback: '&',
            perPageValues: '<?',
            isPerPageVisible: '<?',
            sort: '<'
        },
        templateUrl: 'igz_controls/components/pagination/pagination.component.tpl.html',
        controller: IgzPaginationController
    });

    function IgzPaginationController($scope, $timeout, lodash, EventHelperService, LocalStorageService, PaginationService) {
        var ctrl = this;

        ctrl.jumpPage = 1;
        ctrl.maxPagesToDisplay = 9;
        ctrl.page = 0;
        ctrl.pages = [];
        ctrl.perPage = null;
        ctrl.jumpToPagePattern = new RegExp('^\\d+$');

        ctrl.$onInit = onInit;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.jumpToPage = jumpToPage;
        ctrl.onPerPageChanged = onPerPageChanged;
        ctrl.goToNextPage = goToNextPage;
        ctrl.goToPage = goToPage;
        ctrl.goToPrevPage = goToPrevPage;

        //
        // Hook methods
        //

        /**
         * Constructor
         */
        function onInit() {
            if (angular.isUndefined(ctrl.perPageValues)) {
                ctrl.perPageValues = PaginationService.perPageDefaults();
            }

            ctrl.perPage = lodash.some(ctrl.perPageValues, 'id', ctrl.pageData.size) ? ctrl.pageData.size : ctrl.perPageValues[0].id;

            $scope.$watch('$ctrl.pageData.total', initValues);
            $scope.$watch('$ctrl.pageData.number', updatePage);
        }

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            ctrl.jumpPage = newData;
        }

        /**
         * Method to jump to page
         */
        function jumpToPage() {
            $timeout(function () {
                ctrl.jumpPage = parseInt(ctrl.jumpPage, 10);
                if (ctrl.jumpPage > 0 && ctrl.jumpPage <= ctrl.pageData.total) {

                    // ctrl.jumpToPage numbering begins from 1, not from 0
                    ctrl.goToPage(ctrl.jumpPage - 1);
                } else {
                    ctrl.jumpPage = String(ctrl.page + 1);
                }
            });
        }

        /**
         * Method selecting active page as first on changing rows per page
         * @param {Object} item - new item
         * @param {boolean} isItemChanged - was value changed or not
         */
        function onPerPageChanged(item, isItemChanged) {
            if (isItemChanged) {
                lodash.set(ctrl, 'perPage', item.id);
            }

            if (angular.isDefined(ctrl.entityName)) {
                LocalStorageService.setItem('itemsPerPage', ctrl.entityName, ctrl.perPage);
            }

            ctrl.goToPage(0);
        }

        /**
         * Go to next page by clicking Next button
         * Or to first page if the last page is current
         * @param {Object} event
         */
        function goToNextPage(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.goToPage((ctrl.page + 1) % ctrl.pageData.total);
            }
        }

        /**
         * Method to switch page
         * @param {string|number} pageNumber
         * @param {Object} [event]
         * @returns {boolean}
         */
        function goToPage(pageNumber, event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                if (pageNumber === '...') {
                    return false;
                }
                ctrl.page = pageNumber;
                generatePagesArray();

                if (angular.isFunction(ctrl.paginationCallback)) {
                    ctrl.paginationCallback({
                        page: ctrl.page,
                        size: ctrl.perPage,
                        additionalParams: {
                            sort: ctrl.sort
                        }
                    });
                }
            }
        }

        /**
         * Go to previous page by clicking Previous button
         * @param {Object} event
         */
        function goToPrevPage(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.goToPage(ctrl.page === 0 ? ctrl.pageData.total - 1 : ctrl.page - 1);
            }
        }

        //
        // Private methods
        //

        /**
         * Generates pages array
         */
        function generatePagesArray() {

            // The first page is always displayed
            ctrl.pages = [0];

            // if there are more pages than allowed, we need to exclude some pages:
            // 1 2 3 4 5 6 7 ... 15
            if (ctrl.pageData.total > ctrl.maxPagesToDisplay) {

                // 4 is count of elements that should be present: '1 page', '...', '...', 'Last page'
                var middleGroup = ctrl.maxPagesToDisplay - 4;

                // if current page is in the beginning
                // 1 2 3 4 5 6 7 ... 15
                if (ctrl.page < middleGroup) {
                    [].push.apply(ctrl.pages, lodash.range(1, middleGroup + 2));

                    ctrl.pages.push('...');

                    // if current page is in the end
                    // 1 ... 9 10 11 12 13 14 15
                } else if (ctrl.page >= ctrl.pageData.total - middleGroup) {
                    ctrl.pages.push('...');
                    [].push.apply(ctrl.pages, lodash.range(ctrl.pageData.total - middleGroup - 2, ctrl.pageData.total - 1));

                    // if current page is in the middle
                    // 1 ... 6 7 8 9 10 ... 15
                } else {
                    ctrl.pages.push('...');

                    // calculate how many pages should be displayed before active page
                    // for example, there are 9 pages max, so: 1 | ... | middle group | ... | last page
                    // Middle group looks like: | visible1 | visible2 | current | visible3 | visible4
                    var firstVisiblePage = ctrl.page - Math.ceil((middleGroup - 1) / 2);

                    // calculate how many pages should be displayed after active page
                    var lastVisiblePage = ctrl.page + Math.floor((middleGroup - 1) / 2);

                    [].push.apply(ctrl.pages, lodash.range(firstVisiblePage, lastVisiblePage + 1));

                    ctrl.pages.push('...');
                }

                // Add the last page
                ctrl.pages.push(ctrl.pageData.total - 1);
            } else {

                // if there are less pages, than max allowed, display them all
                [].push.apply(ctrl.pages, lodash.range(1, ctrl.pageData.total));
            }
        }

        /**
         * Initialise values
         */
        function initValues() {
            updatePage();
            ctrl.jumpPage = String(Math.floor(ctrl.pageData.total / 2));

            if (ctrl.pageData.total > 0) {
                ctrl.jumpToPagePattern = createNumberPattern(ctrl.pageData.total);
            }

            generatePagesArray();
        }

        /**
         * Updates current page value from pageData object
         */
        function updatePage() {
            ctrl.page = ctrl.pageData.number;
        }

        /**
         * Creates a RegExp pattern that validates only numbers in the range from 1 to `upperBound`.
         * @param {number} upperBound - the maximum number to consider valid by the returned RegExp pattern.
         * @returns {RegExp} a RegExp pattern as a string, that validates a given string to be a number in the range
         *     from 1 to `upperBound`, or the empty-string (`''`) if `upperBound` is not of type `number` or if it is
         *     a non-positive number.
         */
        function createNumberPattern(upperBound) {
            var str = String(upperBound);
            var len = str.length;

            if (!angular.isNumber(upperBound) || upperBound <= 0) {
                return '';
            }

            if (len === 1) {
                return '^[1-' + str + ']$';
            }

            var patterns = ['\\d{1,' + (len - 1) + '}'];
            var lastDigits = '';
            lodash.forEach(lodash.initial(str), function (digit, index) {
                var upper = Number(digit) - 1;
                if (upper >= 0) {
                    patterns.push(lastDigits + '[0-' + upper + ']\\d{' + (len - 1 - index) + '}');
                }
                lastDigits += digit;
            });
            patterns.push(lastDigits + '[0-' + upperBound % 10 + ']');
            return new RegExp('^(?!0+$)(' + patterns.join('|') + ')$');
        }
    }
})();
'use strict';

(function () {
    'use strict';

    PaginationController.$inject = ['$i18next', '$injector', '$location', '$rootScope', '$stateParams', '$timeout', 'i18next', 'lodash', 'ActionCheckboxAllService', 'PaginationService', 'entitiesType', 'onChangePageCallback', 'dataServiceName', 'vm', 'emptyOnPageChange'];
    angular.module('iguazio.dashboard-controls').controller('PaginationController', PaginationController);

    /*eslint no-shadow: 0*/
    function PaginationController($i18next, $injector, $location, $rootScope, $stateParams, $timeout, i18next, lodash, ActionCheckboxAllService, PaginationService, entitiesType, onChangePageCallback, dataServiceName, vm, emptyOnPageChange) {

        // entityId - id of nested entity
        var entityId = lodash.defaultTo($location.search().entityId, $stateParams.id);
        var selectedItemId = $stateParams.selectedItemId || $location.search().id;
        var dataService = null;
        var lng = i18next.language;

        vm.sort = '';
        vm.entityUiConfig = [];

        vm.changePage = changePage;
        vm.updatePagination = updatePagination;

        activate();

        //
        // Public methods
        //

        /**
         * Changes entities by getting new portion of data from the back-end.
         * @param {number} pageNumber - new page number to get data from.
         * @param {number} perPage - how many items should be present on a page.
         * @param {Object} [additionalParams] - additional parameters that should be passed to data service method
         *     (e.g. filter, include, sort, etc.).
         */
        function changePage(pageNumber, perPage, additionalParams) {
            var pageAdditionalParams = lodash.cloneDeep(additionalParams);
            selectedItemId = lodash.defaultTo($stateParams.selectedItemId, $location.search().id);
            selectedItemId = isNumeric(selectedItemId) ? lodash.toInteger(selectedItemId) : selectedItemId;

            vm.isSplashShowed.value = lodash.get(additionalParams, 'isSplashShowed', true);

            if (lodash.isFunction(vm.closeInfoPane)) {
                vm.closeInfoPane();
            }

            vm.page.size = perPage;
            vm.page.number = lodash.isNil(selectedItemId) ? pageNumber : 0;

            if (!lodash.defaultTo(vm.preventModifyURL, false)) {
                $location.search('pageSize', vm.page.size);

                if (lodash.isNil($location.search().id)) {
                    $location.search('pageNumber', vm.page.number + 1);
                }
            }

            // save entities ui state
            vm.entityUiConfig = lodash.map(vm[entitiesType], function (el) {
                return lodash.pick(el, ['id', 'ui']);
            });

            if (lodash.defaultTo(emptyOnPageChange, true)) {
                vm[entitiesType] = [];
            }

            // abort all pending statistics requests
            $rootScope.$broadcast('statistics-data_abort-requests');

            var methodName = entitiesType + 'Paginated';
            return dataService[methodName](lodash.isNil(selectedItemId) ? vm.page.number : null, vm.page.size, fillAdditionalParams(pageAdditionalParams), entityId).then(function (response) {
                vm[entitiesType] = response;

                // restore entities ui.checked state after page changing
                if (vm.entityUiConfig.length > 0) {
                    lodash.forEach(vm[entitiesType], function (el) {
                        lodash.merge(el, {
                            ui: {
                                checked: lodash.chain(vm.entityUiConfig).find({ id: el.id }).get('ui.checked').defaultTo(false).value()
                            }
                        });
                    });
                    var checkedItems = lodash.filter(vm[entitiesType], ['ui.checked', true]);
                    ActionCheckboxAllService.setCheckedItemsCount(checkedItems.length);
                }

                vm.page.total = lodash.get(vm[entitiesType], 'total_pages', 1);
                vm.page.number = lodash.get(vm[entitiesType], 'page_number', vm.page.number);

                if (!lodash.defaultTo(vm.preventModifyURL, false) && lodash.isNil($location.search().id)) {
                    $location.search('pageNumber', vm.page.number + 1);
                }

                checkPageNumber(additionalParams);

                if (!lodash.isNil(selectedItemId)) {
                    $timeout(function () {
                        var selectedItem = lodash.find(vm[entitiesType], { id: selectedItemId });

                        $rootScope.$broadcast(entitiesType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '-table-row_on-select-row', selectedItem);
                        $stateParams.selectedItemId = null;
                    });
                }

                checkSearchStates();

                // if some additional processing required
                if (lodash.isFunction(onChangePageCallback)) {
                    onChangePageCallback();
                }

                // Hide loading splash screen
                vm.isSplashShowed.value = false;
            }).catch(function (error) {
                var errorMessages = {
                    '400': $i18next.t('common:ERROR_MSG.PAGINATION.400', { lng: lng }),
                    '403': $i18next.t('common:ERROR_MSG.PAGINATION.403', { lng: lng }),
                    '500': $i18next.t('common:ERROR_MSG.ERROR_ON_SERVER_SIDE', { lng: lng }),
                    'default': $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR', { lng: lng })
                };
                var message = lodash.get(errorMessages, String(error.status), errorMessages.default);

                $rootScope.$broadcast('splash-screen_show-error', {
                    alertText: message + ' ' + $i18next.t('common:ERROR_MSG.YOU_CAN_TRY_TO_REFRESH_PAGE', { lng: lng })
                });
            });
        }

        /**
         * Updates current page by reloading it with the same page number and page size.
         * @param {Object} additionalParams -
         */
        function updatePagination(additionalParams) {
            return vm.changePage(vm.page.number, vm.page.size, additionalParams);
        }

        //
        // Private methods
        //

        /**
         * Constructor method.
         */
        function activate() {
            initializePageInfo();

            dataService = $injector.get(lodash.defaultTo(dataServiceName, lodash.upperFirst(entitiesType) + 'DataService'));
        }

        /**
         * Checks if page number (from response) is out of bounds. If it is, goes to last page.
         * @param {Object} [additionalParams] - additional parameters that should be passed to data service method.
         */
        function checkPageNumber(additionalParams) {
            var oldPageNumber = vm.page.number;
            vm.page.number = Math.min(vm.page.number, vm.page.total - 1);
            if (oldPageNumber !== vm.page.number) {
                vm.updatePagination(additionalParams);
            }
        }

        /**
         * Toggles `searchNotFound` state on or off according to the list being empty or not.
         */
        function checkSearchStates() {
            if (!lodash.isNil(vm.searchStates)) {
                vm.searchStates.searchNotFound = vm[entitiesType].length === 0 && vm.page.number === 0;
            }
        }

        /**
         * Returns additional params with items id, filtering and sorting if it exists
         * @param {Object} [additionalParams={}]
         * @returns {Object}
         */
        function fillAdditionalParams(additionalParams) {
            if (!lodash.isObject(additionalParams)) {
                additionalParams = {};
            }

            additionalParams.sort = (vm.isReverseSorting ? '-' : '') + vm.sortedColumnName;

            if (!lodash.isNil(selectedItemId)) {
                additionalParams['page[of]'] = selectedItemId;
            }

            if (lodash.isFunction(vm.clearFilters) && !lodash.isNil(selectedItemId)) {
                vm.clearFilters();
            }

            if (lodash.isFunction(vm.getActiveFilters)) {
                lodash.defaultsDeep(additionalParams, vm.getActiveFilters());
            }

            return additionalParams;
        }

        /**
         * Initializes page info.
         */
        function initializePageInfo() {
            lodash.defaultsDeep(vm, {
                page: {
                    number: 0,
                    size: 10,
                    total: 0
                }
            });

            // Get data provided in url
            var providedData = $location.search();
            var pageSize = Number.parseInt(lodash.get(providedData, 'pageSize'));
            var providedPageSizeValue = Number.isInteger(pageSize) ? pageSize : vm.page.size;

            // Set page size
            var perPageOptions = lodash.isNil(vm.perPageValues) ? PaginationService.perPageDefaults() : vm.perPageValues;
            var perPage = lodash.chain(perPageOptions).sortBy('id').map('id').find(function (option) {
                return option >= providedPageSizeValue;
            }).defaultTo(lodash.maxBy(perPageOptions, 'id').id).value();

            vm.page.size = PaginationService.getPageSize(entitiesType, perPage);

            // Set page number
            var providedPageNumber = Number.parseInt(lodash.get(providedData, 'pageNumber'));
            vm.page.number = !lodash.isInteger(providedPageNumber) ? vm.page.number : Math.max(providedPageNumber - 1, 0);
        }
    }

    /**
     * Checks if a string is a whole number (i.e. consists of digits only).
     * @param {string} value - the string to test.
     * @returns {boolean} `ture` if `value` consists of digit characters only, or `false` otherwise.
     */
    function isNumeric(value) {
        return (/^\d+$/.test(value)
        );
    }
})();
'use strict';

(function () {
    'use strict';

    PaginationService.$inject = ['$controller', 'lodash', 'LocalStorageService'];
    angular.module('iguazio.dashboard-controls').factory('PaginationService', PaginationService);

    function PaginationService($controller, lodash, LocalStorageService) {
        return {
            addPagination: addPagination,
            perPageDefaults: perPageDefaults,
            getPageSize: getPageSize
        };

        //
        // Public methods
        //

        /**
         * Initialize new Pagination controller and bind it's method to another controller
         * @param {Object} controller vm
         * @param {string} entitiesType name of entities type
         * @param {string} [dataServiceName] Name of DataService
         * @param {function} [onChangePageCallback] Additional code that should be executed after page changed
         * @param {boolean} [emptyOnPageChange=true] Set to `false` to prevent list from emptying before repopulating
         */
        function addPagination(controller, entitiesType, dataServiceName, onChangePageCallback, emptyOnPageChange) {
            $controller('PaginationController', {
                entitiesType: entitiesType,
                onChangePageCallback: onChangePageCallback,
                dataServiceName: dataServiceName,
                vm: controller,
                emptyOnPageChange: emptyOnPageChange
            });
        }

        /**
         * Returns default values for perPage dropdown
         * @returns {Array.<Object>}
         */
        function perPageDefaults() {
            return [{
                id: 10,
                name: '10'
            }, {
                id: 20,
                name: '20'
            }, {
                id: 30,
                name: '30'
            }, {
                id: 40,
                name: '40'
            }];
        }

        /**
         * Gets page size from localStorage if it exist there.
         * If no - set default page size to localStorage and return it
         * @param {string} entity - entity name
         * @param {number} pageSize - default value of page size
         * @returns {number}
         */
        function getPageSize(entity, pageSize) {
            var storedPerPage = angular.copy(LocalStorageService.getItem('itemsPerPage', entity));

            if (lodash.isNil(storedPerPage)) {
                LocalStorageService.setItem('itemsPerPage', entity, pageSize);
                storedPerPage = pageSize;
            }

            return storedPerPage;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzSliderInputBlockController.$inject = ['$rootScope', '$scope', '$timeout', 'lodash', 'ConverterService'];
    angular.module('iguazio.dashboard-controls').component('igzSliderInputBlock', {
        bindings: {
            allowFullRange: '<',
            onChangeCallback: '<',
            onSliderChanging: '<?',
            sliderConfig: '<',
            sliderBlockUpdatingBroadcast: '@',
            measureUnits: '<?',
            valueUnit: '<?',
            updateSliderInput: '@?'
        },
        templateUrl: 'igz_controls/components/slider-input-block/slider-input-block.tpl.html',
        controller: IgzSliderInputBlockController
    });

    function IgzSliderInputBlockController($rootScope, $scope, $timeout, lodash, ConverterService) {
        var ctrl = this;

        var defaultMeasureUnits = [{
            pow: 1,
            name: 'KB/s'
        }, {
            pow: 2,
            name: 'MB/s'
        }, {
            pow: 3,
            name: 'GB/s'
        }];

        ctrl.$onInit = onInit;

        ctrl.changeTrafficUnit = changeTrafficUnit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // Set default measureUnits if undefined
            if (angular.isUndefined(ctrl.measureUnits)) {
                ctrl.measureUnits = defaultMeasureUnits;
            }

            $scope.$on(ctrl.sliderBlockUpdatingBroadcast, setData);

            $timeout(function () {

                // Bind needed callbacks to configuration objects with updated `ctrl.selectedData` values (for rz-slider library usage)
                ctrl.sliderConfig.options.onEnd = setValue;
                ctrl.sliderConfig.options.onChange = checkIfUnlimited;
            });

            ctrl.selectedItem = lodash.find(ctrl.measureUnits, ['name', ctrl.sliderConfig.unitLabel]);

            // Update data with values from external scope
            fillRange();
        }

        //
        // Public methods
        //

        /**
         * Method changes measurement unit
         * @param {Object} trafficUnit - selected measurement unit value
         */
        function changeTrafficUnit(trafficUnit) {
            ctrl.sliderConfig.unitLabel = trafficUnit.name;
            ctrl.sliderConfig.pow = trafficUnit.pow;

            setValue();
        }

        //
        // Private methods
        //

        /**
         * Method checks current value in slider. If it's maximum available then 'U/L'(unlimited) sets in label which displays data.
         * If it's not maximum - label sets with new value.
         * Calls onSliderChanging method if it was defined
         */
        function checkIfUnlimited() {
            ctrl.sliderConfig.valueLabel = ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil && !ctrl.allowFullRange ? 'U/L' : ctrl.sliderConfig.value;

            if (angular.isFunction(ctrl.onSliderChanging) && ctrl.sliderConfig.value !== ctrl.sliderConfig.options.ceil) {
                ctrl.onSliderChanging(ctrl.sliderConfig.value, ctrl.updateSliderInput);
            }

            $timeout(function () {
                $rootScope.$broadcast('rzSliderForceRender');
            });
        }

        /**
         * Update slider data with values from external scope
         */
        function fillRange() {
            if (ctrl.selectedData) {
                var result = ConverterService.getConvertedBytes(ctrl.selectedData[ctrl.sliderConfig.options.id]);

                ctrl.sliderConfig.value = result.value;
                ctrl.sliderConfig.valueLabel = result.value;
                ctrl.sliderConfig.unitLabel = result.label;
                ctrl.sliderConfig.pow = result.pow;

                ctrl.selectedItem = lodash.find(defaultMeasureUnits, ['name', ctrl.sliderConfig.unitLabel]);

                checkIfUnlimited();
            }
        }

        /**
         * Set slider data with a value passed through broadcast.
         * Set current selected rule to bind data properly.
         * @param {Object} event - triggering event
         * @param {Object} data - passed data
         */
        function setData(event, data) {
            ctrl.selectedData = data.item.attr;

            fillRange();
        }

        /**
         * Method sets new value in bytes
         */
        function setValue() {
            if (!lodash.isNil(ctrl.onChangeCallback)) {
                ctrl.onChangeCallback(ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ? null : ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow), ctrl.updateSliderInput);
            }

            if (!lodash.isNil(ctrl.selectedData)) {
                ctrl.selectedData[ctrl.sliderConfig.options.id] = ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ? 0 : ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('igzSortDropdown', {
        bindings: {
            sortOptions: '<',
            reverseSorting: '<',
            updateDataCallback: '<'
        },
        templateUrl: 'igz_controls/components/sort-dropdown/sort-dropdown.tpl.html',
        controller: IgzSortDropdownController
    });

    function IgzSortDropdownController() {
        var ctrl = this;

        ctrl.getItemClass = getItemClass;
        ctrl.toggleSortingOrder = toggleSortingOrder;

        //
        // Public methods
        //

        /**
         * Returns item's class attribute
         * @param {boolean} isFieldActive - state of item
         * @returns {string}
         */
        function getItemClass(isFieldActive) {
            return isFieldActive ? 'active-item' : '';
        }

        /**
         * Toggles sorting order for files
         * @param {string} option - attribute to sort by
         */
        function toggleSortingOrder(option) {
            if (angular.isFunction(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback(option);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzSplashScreenController.$inject = ['$scope', '$state', '$i18next', 'i18next'];
    angular.module('iguazio.dashboard-controls').component('igzSplashScreen', {
        bindings: {
            isSplashShowed: '<'
        },
        templateUrl: 'igz_controls/components/splash-screen/splash-screen.tpl.html',
        controller: IgzSplashScreenController
    });

    function IgzSplashScreenController($scope, $state, $i18next, i18next) {
        var ctrl = this;
        var lng = i18next.language;

        // public properties
        ctrl.isLoading = true;
        ctrl.isAlertShowing = false;
        ctrl.textToDisplay = $i18next.t('common:LOADING_CAPITALIZE_ELLIPSIS', { lng: lng });

        ctrl.$onInit = onInit;

        // public methods
        ctrl.refreshPage = refreshPage;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('splash-screen_show-error', showError);
            $scope.$on('browse-action_change-loading-text', changeLoadingText);
        }

        //
        // Public methods
        //

        /**
         * Sends broadcast to refresh browse page
         */
        function refreshPage() {
            ctrl.isLoading = true;
            ctrl.isAlertShowing = false;

            $state.reload();
        }

        //
        // Private methods
        //

        /**
         * Changes displayed text on loading spinner
         * @param {Object} event - broadcast event
         * @param {Object} data - broadcast data with text to be displayed
         */
        function changeLoadingText(event, data) {
            ctrl.textToDisplay = data.textToDisplay;
        }

        /**
         * Shows error text
         * @param {Object} event - native broadcast event
         * @param {string} data - broadcast data
         */
        function showError(event, data) {
            if (angular.isDefined(data.textToDisplay)) {
                ctrl.textToDisplay = data.textToDisplay;
            }

            if (angular.isDefined(data.alertText)) {
                ctrl.alertText = data.alertText;
            }

            ctrl.isLoading = false;
            ctrl.isAlertShowing = true;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /**
     * compareInputValue: used if there are two field that should be equal (password and confirm password)
     * fieldType: input, textarea or password
     * formObject: object of HTML form
     * hideCounter: should be counter of remaining symbols for the field visible or not
     * inputId: string that should be assigned to id attribute
     * inputModelOptions: custom options for ng-model-options
     * inputName: name attribute of an input
     * inputValue: data model
     * itemBlurCallback: callback for onBlur event
     * itemFocusCallback: callback for onFocus event
     * isDataRevert: should incorrect value be immediately replaced by a previous correct one
     * isDisabled: is input should be disabled
     * isFocused: should input be focused when screen is displayed
     * trim: whether the input value will automatically trim
     * onlyValidCharacters: allow only that characters which passed regex pattern
     * placeholderText: text that is displayed when input is empty
     * readOnly: is input should be readonly
     * spellcheck: disable spell check for some field, for example input for base64 string
     * updateDataCallback: triggered when input was changed by a user, added whn two-way binding was replased with one-way
     * updateDataField: field name for updateDataCallback
     * validationIsRequired: input can't be empty
     * validationMaxLength: value should be shorter or equal this value
     * validationPattern: validation with regex
     * autoComplete: the string to use as a value to the "autocomplete" HTML attribute of the INPUT tag
     */

    IgzValidatingInputFieldController.$inject = ['$element', '$timeout', '$window', 'lodash', 'EventHelperService', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzValidatingInputField', {
        bindings: {
            autoComplete: '@?',
            compareInputValue: '<?',
            enterCallback: '<?',
            fieldType: '@',
            formObject: '<',
            hideCounter: '<?',
            inputIcon: '@',
            inputModelOptions: '<?',
            inputName: '@',
            inputValue: '<',
            isClearIcon: '<?',
            isDisabled: '<?',
            isDataRevert: '@?',
            isFocused: '<?',
            itemBlurCallback: '&?',
            itemFocusCallback: '&?',
            onBlur: '&?',
            onlyValidCharacters: '<?',
            placeholderText: '@',
            readOnly: '<?',
            spellcheck: '@?',
            trim: '<?',
            updateDataCallback: '&?',
            updateDataField: '@?',
            validationIsRequired: '<',
            validationMaxLength: '@',
            validationPattern: '<'
        },
        templateUrl: 'igz_controls/components/validating-input-field/validating-input-field.tpl.html',
        controller: IgzValidatingInputFieldController
    });

    function IgzValidatingInputFieldController($element, $timeout, $window, lodash, EventHelperService, FormValidationService) {
        var ctrl = this;

        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                '*': 200,
                'blur': 0
            },
            allowInvalid: true
        };

        ctrl.data = '';
        ctrl.inputFocused = false;
        ctrl.startValue = '';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.getRemainingSymbolsCounter = getRemainingSymbolsCounter;
        ctrl.isFieldInvalid = isFieldInvalid;
        ctrl.isCounterVisible = isCounterVisible;
        ctrl.focusInput = focusInput;
        ctrl.keyDown = keyDown;
        ctrl.unfocusInput = unfocusInput;
        ctrl.updateInputValue = updateInputValue;
        ctrl.clearInputField = clearInputField;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (!lodash.isNil(ctrl.disabled)) {
                ctrl.disableField = ctrl.disabled;
            }

            ctrl.inputModelOptions = lodash.defaultsDeep(ctrl.inputModelOptions || {}, defaultInputModelOptions);

            ctrl.inputFocused = ctrl.isFocused;
            ctrl.spellcheck = ctrl.spellcheck || 'true';

            ctrl.data = angular.copy(lodash.defaultTo(ctrl.inputValue, ''));
            ctrl.startValue = angular.copy(ctrl.inputValue);

            lodash.defaults(ctrl, {
                hideCounter: false,
                isDisabled: false,
                trim: true,
                readOnly: false,
                onlyValidCharacters: false
            });
        }

        /**
         * Method called after initialization
         */
        function postLink() {
            if (ctrl.isFocused) {

                // check is this input field is in dialog
                if (angular.isDefined($element.closest('.ngdialog')[0])) {
                    angular.element($window).on('animationend', function (event) {

                        if (event.originalEvent.animationName === 'ngdialog-fadein' && event.target.className === 'ngdialog-content') {
                            $timeout(function () {
                                $element.find('.field')[0].focus();
                                angular.element($window).off('animationend');
                            }, 300);
                        }
                    });
                } else {
                    $timeout(function () {
                        $element.find('.field')[0].focus();
                    });
                }
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            angular.element($window).off('animationend');
        }

        /**
         * onChange hook
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.inputValue)) {
                if (!changes.inputValue.isFirstChange()) {
                    ctrl.data = angular.copy(changes.inputValue.currentValue);
                    ctrl.startValue = angular.copy(ctrl.inputValue);
                }
            }

            if (angular.isDefined(changes.isFocused)) {
                if (!changes.isFocused.isFirstChange()) {
                    $timeout(function () {
                        $element.find('.field')[0].focus();
                    });
                }
            }
        }

        //
        // Public methods
        //

        /**
         * Get counter of the remaining symbols for the field
         * @returns {number}
         */
        function getRemainingSymbolsCounter() {
            if (ctrl.formObject) {
                var maxLength = parseInt(ctrl.validationMaxLength);
                var inputViewValue = lodash.get(ctrl.formObject, ctrl.inputName + '.$viewValue');

                return maxLength >= 0 && inputViewValue ? (maxLength - inputViewValue.length).toString() : null;
            }
        }

        /**
         * Check whether the field is invalid.
         * Do not validate field if onlyValidCharacters parameter was passed.
         * @returns {boolean}
         */
        function isFieldInvalid() {
            return !ctrl.onlyValidCharacters ? FormValidationService.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName) : false;
        }

        /**
         * Check whether the counter should be visible
         * @returns {boolean}
         */
        function isCounterVisible() {
            return !ctrl.isDisabled && !ctrl.onlyValidCharacters && !ctrl.hideCounter && !ctrl.readOnly && ctrl.validationMaxLength;
        }

        /**
         * Method to make input unfocused
         */
        function focusInput() {
            ctrl.inputFocused = true;
            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback({ inputName: ctrl.inputName });
            }
        }

        /**
         * Method which have been called from 'keyDown' event
         * @param {Object} event - native event object
         */
        function keyDown(event) {
            if (angular.isDefined(ctrl.enterCallback) && event.keyCode === EventHelperService.ENTER) {
                $timeout(ctrl.enterCallback);
            }
        }

        /**
         * Method to make input unfocused
         */
        function unfocusInput() {
            ctrl.inputFocused = false;

            // If 'data revert' option is enabled - set or revert outer model value
            setOrRevertInputValue();
        }

        /**
         * Updates outer model value on inner model value change
         * Used for `ng-change` directive
         */
        function updateInputValue() {
            if (angular.isDefined(ctrl.data)) {
                ctrl.inputValue = angular.isString(ctrl.data) && ctrl.trim ? ctrl.data.trim() : ctrl.data;
            }

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({ newData: ctrl.inputValue, field: angular.isDefined(ctrl.updateDataField) ? ctrl.updateDataField : ctrl.inputName });
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.data = '';
            updateInputValue();
        }

        //
        // Private methods
        //

        /**
         * Sets or reverts outer model value
         */
        function setOrRevertInputValue() {
            $timeout(function () {
                if (ctrl.isDataRevert === 'true') {

                    // If input is invalid - inner model value is set to undefined by Angular
                    if (angular.isDefined(ctrl.data) && ctrl.startValue !== Number(ctrl.data)) {
                        ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
                        if (angular.isFunction(ctrl.itemBlurCallback)) {
                            ctrl.itemBlurCallback({ inputValue: ctrl.inputValue, inputName: ctrl.inputName });
                        }
                        ctrl.startValue = Number(ctrl.data);
                    } else {

                        // Revert input value; Outer model value just does not change
                        ctrl.data = ctrl.inputValue;
                        if (angular.isFunction(ctrl.onBlur)) {
                            ctrl.onBlur({ inputName: ctrl.inputName });
                        }
                    }
                } else {
                    if (angular.isFunction(ctrl.itemBlurCallback)) {
                        ctrl.itemBlurCallback({ inputValue: ctrl.inputValue, inputName: ctrl.inputName });
                    }
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItemMore.$inject = ['$element', '$document', '$scope'];
    angular.module('iguazio.dashboard-controls').component('igzActionItemMore', {
        bindings: {
            actions: '<?',
            onFilesDropped: '<?'
        },
        templateUrl: 'igz_controls/components/action-item/action-item-more/action-item-more.tpl.html',
        controller: IgzActionItemMore,
        transclude: true
    });

    function IgzActionItemMore($element, $document, $scope) {
        var ctrl = this;

        ctrl.isDropdownShown = false;

        ctrl.toggleTemplate = toggleTemplate;

        //
        // Public methods
        //

        /**
         * Shows/hides sub-template
         */
        function toggleTemplate() {
            ctrl.isDropdownShown = !ctrl.isDropdownShown;
            if (ctrl.isDropdownShown) {
                attachDocumentEvent();
            } else {
                detachDocumentEvent();
            }
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', hideSubtemplate);
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', hideSubtemplate);
        }

        /**
         * Hides sub-template dropdown when user clicks outside it
         * @param {MouseEvent} event
         */
        function hideSubtemplate(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    ctrl.isDropdownShown = false;
                    detachDocumentEvent();
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('igzActionItemRefresh', {
        bindings: {
            isDisabled: '<',
            refresh: '&'
        },
        templateUrl: 'igz_controls/components/action-item/action-item-refresh/action-item-refresh.tpl.html'
    });
})();
'use strict';

(function () {
    'use strict';

    IgzInfoPageActionsBarController.$inject = ['$scope'];
    angular.module('iguazio.dashboard-controls').component('igzInfoPageActionsBar', {
        bindings: {
            watchId: '@?'
        },
        templateUrl: 'igz_controls/components/info-page/info-page-actions-bar/info-page-actions-bar.tpl.html',
        transclude: true,
        controller: IgzInfoPageActionsBarController
    });

    function IgzInfoPageActionsBarController($scope) {
        var ctrl = this;

        ctrl.isUpperPaneShowed = false;
        ctrl.isFiltersShowed = false;
        ctrl.isInfoPaneShowed = false;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-filters_toggle-start' + watchId, onFiltersPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, onInfoPaneToggleStart);
        }

        //
        // Private methods
        //

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Filters pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents filters pane state
         */
        function onFiltersPaneToggleStart(e, isShown) {
            ctrl.isFiltersShowed = isShown;
        }

        /**
         * Info pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents info pane state
         */
        function onInfoPaneToggleStart(e, isShown) {
            ctrl.isInfoPaneShowed = isShown;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzInfoPageContentController.$inject = ['$scope', '$timeout', '$window', '$element'];
    angular.module('iguazio.dashboard-controls').component('igzInfoPageContent', {
        bindings: {
            scrolled: '<',
            watchId: '@?'
        },
        templateUrl: 'igz_controls/components/info-page/info-page-content/info-page-content.tpl.html',
        transclude: true,
        controller: IgzInfoPageContentController
    });

    function IgzInfoPageContentController($scope, $timeout, $window, $element) {
        var ctrl = this;

        ctrl.isFiltersShowed = false;
        ctrl.isInfoPaneShowed = false;

        // Config for horizontal scrollbar on containers view
        ctrl.scrollConfigHorizontal = {
            axis: 'x',
            scrollInertia: 0
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-filters_toggle-start' + watchId, onFiltersPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, onInfoPaneToggleStart);
            $scope.$on('info-page-pane_toggled', dispatchResize);
        }

        /**
         * Linking method
         */
        function postLink() {
            $timeout(function () {
                manageHorizontalScroll();

                $scope.$on('info-page-filters_toggled', manageHorizontalScroll);

                $scope.$on('info-page-pane_toggled', manageHorizontalScroll);

                $scope.$on('igzWatchWindowResize::resize', manageHorizontalScroll);
            });
        }

        //
        // Private methods
        //

        /**
         * Manages x-scrollbar behavior
         * Needed to get rid of accidental wrong content width calculations made by 'ng-scrollbars' library
         * We just control x-scrollbar with lib's native enable/disable methods
         */
        function manageHorizontalScroll() {
            var $scrollXContainer = $element.find('.igz-scrollable-container.horizontal').first();
            var contentWrapper = $element.find('.igz-info-page-content-wrapper').first();

            if ($scrollXContainer.length && contentWrapper.width() < 946) {
                $scrollXContainer.mCustomScrollbar('update');
            } else if ($scrollXContainer.length) {
                $scrollXContainer.mCustomScrollbar('disable', true);
                $element.find('.mCSB_container').first().width('100%');
            }
        }

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Filters pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents filters pane state
         */
        function onFiltersPaneToggleStart(e, isShown) {
            ctrl.isFiltersShowed = isShown;
        }

        /**
         * Info pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents info pane state
         */
        function onInfoPaneToggleStart(e, isShown) {
            ctrl.isInfoPaneShowed = isShown;
        }

        /**
         * Updates Ui-Layout library's containers size
         */
        function dispatchResize() {
            $timeout(function () {
                $window.dispatchEvent(new Event('resize'));
            }, 0);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzInfoPageFiltersController.$inject = ['$rootScope', '$scope', '$animate', '$element', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('igzInfoPageFilters', {
        bindings: {
            isFiltersShowed: '<',
            changeStateCallback: '&',
            toggleMethod: '&',
            resetFilters: '&?',
            applyFilters: '&?',
            getBadgeValue: '&?',
            watchId: '@?'
        },
        templateUrl: 'igz_controls/components/info-page/info-page-filters/info-page-filters.tpl.html',
        transclude: true,
        controller: IgzInfoPageFiltersController
    });

    function IgzInfoPageFiltersController($rootScope, $scope, $animate, $element, EventHelperService) {
        var ctrl = this;

        var appliedFiltersCount = 0;

        ctrl.isUpperPaneShowed = false;
        ctrl.scrollbarConfig = {
            callbacks: {
                whileScrolling: whileScrolling
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onResetFilters = onResetFilters;
        ctrl.isShowFooterButtons = isShowFooterButtons;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            ctrl.getBadgeValue = ctrl.getBadgeValue || getBadgeValue;

            $scope.$on('info-page-filters_change-badge', onChangeBadge);
            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, hideIfInfoPaneOpened);
        }

        /**
         * Bindings changes watcher method
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.isFiltersShowed)) {
                reportStateBetweenPanes(changes.isFiltersShowed.currentValue);
            }
        }

        //
        // Public methods
        //

        /**
         * Handles mouse click on 'Apply' button
         * @param {Object} event
         */
        function onApplyFilters(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                $rootScope.$broadcast('info-page-filters_on-apply');
                if (angular.isFunction(ctrl.applyFilters)) {
                    ctrl.applyFilters();
                }
            }
        }

        /**
         * Handles mouse click on 'Reset' button
         * @param {Object} event
         */
        function onResetFilters(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                $rootScope.$broadcast('info-page-filters_on-reset');
                if (angular.isFunction(ctrl.resetFilters)) {
                    ctrl.resetFilters();
                }
            }
        }

        /**
         * Checks whether the footer buttons is shown
         * @returns {boolean}
         */
        function isShowFooterButtons() {
            return angular.isFunction(ctrl.resetFilters) || angular.isFunction(ctrl.applyFilters);
        }

        //
        // Private methods
        //

        /**
         * Returns a quantity of applied filters
         * @returns {number}
         */
        function getBadgeValue() {
            return appliedFiltersCount;
        }

        /**
         * Changes count of applied filters on badge
         * @param {Event} event
         * @param {number} count
         */
        function onChangeBadge(event, count) {
            appliedFiltersCount = Math.max(appliedFiltersCount + count, 0);
        }

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Hides filters pane if filters pane has been opened
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents pane state
         */
        function hideIfInfoPaneOpened(e, isShown) {
            if (isShown) {
                ctrl.changeStateCallback({ newVal: false });
            }
        }

        /**
         * Manages communication between panes for proper interactions
         * @param {boolean} isShown - represents pane state
         */
        function reportStateBetweenPanes(isShown) {
            $rootScope.$broadcast('info-page-filters_toggle-start' + (angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : ''), isShown);

            $animate[isShown ? 'addClass' : 'removeClass']($element.find('.info-page-filters'), 'info-page-filters-shown').then(function () {
                $rootScope.$broadcast('reload-columns');
                $rootScope.$broadcast('info-page-filters_toggled', isShown);
            });
        }

        /**
         * Callback on scroll event of ng-scrollbars directive
         */
        function whileScrolling() {
            $rootScope.$broadcast('scrollable-container_on-scrolling');
        }
    }
})();
'use strict';

(function () {
    'use strict';

    InfoPageFiltersService.$inject = ['$rootScope'];
    angular.module('iguazio.dashboard-controls').factory('InfoPageFiltersService', InfoPageFiltersService);

    function InfoPageFiltersService($rootScope) {
        return {
            changeBadge: changeBadge
        };

        /**
         * Changes a quantity of applied filters on the badge of filters pane
         * @param {number} delta
         */
        function changeBadge(delta) {
            $rootScope.$broadcast('info-page-filters_change-badge', delta);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /**
     * Extend white background to the bottom of the view port
     */

    igzExtendBackground.$inject = ['$timeout'];
    angular.module('iguazio.dashboard-controls').directive('igzExtendBackground', igzExtendBackground);

    function igzExtendBackground($timeout) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attrs) {
            var timeout = 0;
            var containerPath = 'body';

            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                timeout = Number(attrs.igzExtendBackground) || 0;
                containerPath = attrs.containerPath || 'body';

                $timeout(elementMinHeight, timeout);
                scope.$on('igzWatchWindowResize::resize', elementMinHeight);
            }

            /**
             * Calculate and change element height
             */
            function elementMinHeight() {
                var container = angular.element(containerPath);
                var containerBox = container[0].getBoundingClientRect();
                var paddingBottom = parseInt(container.css('padding-bottom'), 10);
                var box = element[0].getBoundingClientRect();

                if (containerBox.height === 0) {
                    element.css('height', '100%');
                    element.css('padding-bottom', '45px');
                } else {
                    element.css('padding-bottom', '0');
                    element.css('height', containerBox.bottom + paddingBottom - box.top + 'px');
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclFunctionFromTemplateDialogController.$inject = ['$i18next', 'i18next', 'lodash', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionFromTemplateDialog', {
        bindings: {
            closeDialog: '&',
            template: '<'
        },
        templateUrl: 'nuclio/common/screens/create-function/function-from-template/function-from-template-dialog/function-from-template-dialog.tpl.html',
        controller: NclFunctionFromTemplateDialogController
    });

    function NclFunctionFromTemplateDialogController($i18next, i18next, lodash, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        var FILED_KINDS = ['string', 'number', 'choice'];

        var defaultAttributes = {
            string: {
                defaultValue: '',
                password: false
            },
            number: {
                defaultValue: 0,
                step: 1,
                minValue: -Infinity,
                allowZero: false,
                allowNegative: false,
                allowDecimal: false
            },
            choice: {
                choices: [],
                defaultValue: '' // currently assuming "choice" to be a list of strings only
            }
        };
        var templateData = {};

        ctrl.dropdownOptions = {};
        ctrl.fields = [];
        ctrl.templateForm = null;

        ctrl.$onInit = onInit;

        ctrl.dropdownCallback = dropdownCallback;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isFormFilled = isFormFilled;
        ctrl.onApply = onApply;
        ctrl.onClose = onClose;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.fields = lodash.chain(ctrl.template.values).cloneDeep().forIn(function (field, key) {
                field.name = key;
            }).filter(function (field) {
                var kind = lodash.get(field, 'kind');
                return lodash.isString(kind) ? lodash.includes(FILED_KINDS, kind.toLowerCase()) : false;
            }).map(function (field) {

                // converting `kind` property to lower-case in order to be more flexible, allowing the user to
                // specify kind in case-insensitive.
                field.kind = field.kind.toLowerCase();

                // setting default values to various properties
                lodash.defaults(field, {
                    displayName: $i18next.t('functions:UNSPECIFIED_FIELD_NAME', { lng: lng }),
                    description: '',
                    required: false,
                    order: Infinity,
                    attributes: lodash.defaults(field.attributes, defaultAttributes[field.kind])
                });

                if (field.kind === 'number') {
                    if (!field.attributes.allowNegative && field.attributes.minValue < 0) {
                        field.attributes.minValue = field.attributes.allowZero ? 0 : 1;
                    }
                }

                if (field.kind === 'choice') {
                    lodash.update(field, 'attributes.choices', function (choices) {
                        return !lodash.isArray(choices) ? [] : lodash.map(choices, function (choice) {
                            return lodash.isString(choice) ? {
                                id: choice,
                                name: choice,
                                visible: true
                            } : choice;
                        });
                    });
                }

                return field;
            }).uniqBy('name') // prevent `ngRepeat` from breaking on duplicates.
            .sortBy('order').forEach(function (field) {
                lodash.set(templateData, field.name, field.attributes.defaultValue);
            }).value();
        }

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog();
            }
        }

        /**
         * Closes dialog and pass the dialog data
         * @param {Event} [event]
         */
        function onApply(event) {
            if (isFormFilled()) {
                if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                    ctrl.closeDialog({ template: templateData });
                }
            }
        }

        /**
         * Checks if form valid
         */
        function isFormFilled() {
            return lodash.isEmpty(ctrl.templateForm.$error);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(templateData, field, newData);
        }

        /**
         * Sets new selected value from dropdown
         * @param {Object} newData
         * @param {boolean} isChanged
         * @param {string} field
         */
        function dropdownCallback(newData, isChanged, field) {
            if (isChanged) {
                lodash.set(templateData, field, newData.id);
            }
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    NclFunctionVersionRowController.$inject = ['$state', '$i18next', 'i18next', 'lodash', 'ConfigService', 'NuclioHeaderService', 'FunctionsService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionVersionRow', {
        bindings: {
            actionHandlerCallback: '&',
            project: '<',
            function: '<',
            version: '<',
            versionsList: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-version-row/function-version-row.tpl.html',
        controller: NclFunctionVersionRowController
    });

    function NclFunctionVersionRowController($state, $i18next, i18next, lodash, ConfigService, NuclioHeaderService, FunctionsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [];
        ctrl.title = null;

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.onFireAction = onFireAction;
        ctrl.showDetails = showDetails;
        ctrl.onSelectRow = onSelectRow;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.title = {
                project: ctrl.project,
                function: ctrl.function.metadata.name,
                version: ctrl.version.name
            };

            lodash.defaultsDeep(ctrl.version, {
                ui: {
                    checked: false,
                    delete: deleteVersion,
                    edit: editVersion
                }
            });

            ctrl.actions = FunctionsService.initVersionActions();

            var deleteAction = lodash.find(ctrl.actions, { 'id': 'delete' });

            if (!lodash.isNil(deleteAction)) {
                deleteAction.confirm = {
                    message: $i18next.t('functions:DELETE_VERSION', { lng: lng }) + ' “' + ctrl.version.name + '”?',
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'nuclio_alert'
                };
            }
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.version] });
        }

        /**
         * Handles mouse click on a version
         * Navigates to Code page
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function showDetails(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.function.edit.code';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                id: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });
        }

        /**
         * Handles mouse click on a table row and navigates to Code page
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.function.edit.code';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                id: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });

            NuclioHeaderService.updateMainHeader('common:PROJECTS', ctrl.title, $state.current.name);
        }

        //
        // Private methods
        //

        /**
         * Deletes project from projects list
         */
        function deleteVersion() {}
        // TODO no versions till now


        /**
         * Opens `Edit project` dialog
         */
        function editVersion() {
            $state.go('app.project.function.edit.code', {
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclFunctionEventDialogController.$inject = ['$timeout', '$i18next', 'i18next', 'lodash', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionEventDialog', {
        bindings: {
            closeDialog: '&',
            createEvent: '<',
            selectedEvent: '<',
            version: '<',
            createFunctionEvent: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/version/function-event-dialog/function-event-dialog.tpl.html',
        controller: NclFunctionEventDialogController
    });

    function NclFunctionEventDialogController($timeout, $i18next, i18next, lodash, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.buttonText = $i18next.t('common:CREATE', { lng: lng });
        ctrl.errorText = $i18next.t('functions:ERROR_MSG.CREATE_FUNCTION_EVENT', { lng: lng });
        ctrl.titleText = $i18next.t('functions:CREATE_FUNCTION_EVENT', { lng: lng });
        ctrl.contentType = 'application/json';
        ctrl.bodyTheme = 'vs';
        ctrl.isLoadingState = false;
        ctrl.isDeployFailed = false;
        ctrl.isFormChanged = false;
        ctrl.methods = [{
            id: 'POST',
            visible: true,
            name: 'POST'
        }, {
            id: 'GET',
            visible: true,
            name: 'GET'
        }, {
            id: 'PUT',
            visible: true,
            name: 'PUT'
        }, {
            id: 'PATCH',
            visible: true,
            name: 'PATCH'
        }, {
            id: 'DELETE',
            visible: true,
            name: 'DELETE'
        }];
        ctrl.headers = [{
            id: 'application/json',
            visible: true,
            name: 'JSON'
        }, {
            id: 'text/plain',
            visible: true,
            name: 'Plain text'
        }];
        ctrl.selectedMethod = null;
        ctrl.selectedHeader = null;
        ctrl.workingCopy = null;

        ctrl.$onInit = onInit;

        ctrl.applyChanges = applyChanges;
        ctrl.closeEventDialog = closeEventDialog;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onChangeBody = onChangeBody;
        ctrl.onChangeSourceCode = onChangeSourceCode;
        ctrl.onSelectHeader = onSelectHeader;
        ctrl.onSelectMethod = onSelectMethod;

        //
        // Hooks method
        //

        /**
         * Init method
         */
        function onInit() {

            // check if dialog was opened to create event, or edit existing event.
            // if ctrl.createEvent is 'true', that mean dialog was open to create new event.
            // otherwise, for edit existing event, so need to change all corresponding labels.
            if (!ctrl.createEvent) {
                ctrl.titleText = $i18next.t('functions:EDIT_FUNCTION_EVENT', { lng: lng });
                ctrl.buttonText = $i18next.t('common:APPLY', { lng: lng });
                ctrl.errorText = $i18next.t('functions:ERROR_MSG.UPDATE_FUNCTION_EVENT', { lng: lng });
            }

            // if ctrl.selectedEvent hasn't specific fields, that means event was not deployed before, so fill it with default data
            lodash.defaultsDeep(ctrl.selectedEvent, {
                metadata: {
                    namespace: lodash.get(ctrl.version, 'metadata.namespace'),
                    labels: {
                        'nuclio.io/function-name': lodash.get(ctrl.version, 'metadata.name')
                    }
                },
                spec: {
                    displayName: '',
                    triggerKind: 'http',
                    attributes: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        path: ''
                    },
                    body: ''
                }
            });

            // copy event to prevent modifying the original object
            ctrl.workingCopy = angular.copy(ctrl.selectedEvent);

            // get method from event.
            ctrl.selectedMethod = lodash.find(ctrl.methods, ['id', lodash.get(ctrl.selectedEvent, 'spec.attributes.method')]);

            // get content type from event.
            ctrl.contentType = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers.Content-Type');

            // get header from event.
            ctrl.selectedHeader = lodash.find(ctrl.headers, ['id', ctrl.contentType]);
        }

        //
        // Public methods
        //

        /**
         * Saves newly created event on beck-end.
         * If error occurs while saving event, then dialog remains open.
         * @param {Event} event - JS event object
         */
        function applyChanges(event) {
            ctrl.functionEventForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.functionEventForm.$valid && ctrl.isFormChanged) {

                // show 'Loading...' button
                ctrl.isLoadingState = true;

                // save created event on beck-end
                ctrl.createFunctionEvent({ eventData: ctrl.workingCopy, isNewEvent: ctrl.createEvent }).then(function () {
                    ctrl.isDeployFailed = false;

                    // close dialog with newly created or updated event data, and state of event.
                    ctrl.closeDialog({
                        result: {
                            isEventDeployed: true, // If isEventDeployed is 'true' that mean - dialog was closed after creating event, not by pressing 'X' button.
                            selectedEvent: ctrl.workingCopy
                        }
                    });
                }).catch(function () {

                    // dialog remains open.
                    // show error text
                    ctrl.isDeployFailed = true;

                    // hide 'Loading...' button
                    ctrl.isLoadingState = false;
                });
            }
        }

        /**
         * Closes dialog
         */
        function closeEventDialog() {

            // close dialog only if event is not deploying. Means event was deployed / failed / not changed
            if (!ctrl.isLoadingState) {
                ctrl.closeDialog({
                    result: {
                        isEventDeployed: false,
                        selectedEvent: ctrl.selectedEvent
                    }
                });
            }
        }

        /**
         * Sets new data from "Name" field to event object
         * @param {string} newData - data to be set
         * @param {string} field - field which was changed
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.workingCopy.spec, field === 'path' ? 'attributes.path' : field, newData);

            isFormChanged();
        }

        /**
         * Callback from method drop-down
         * Sets new selected method
         * @param {Object} item - new selected item
         */
        function onSelectMethod(item) {
            lodash.set(ctrl.workingCopy, 'spec.attributes.method', item.id);

            isFormChanged();
        }

        /**
         * Callback from Content Type drop-down
         * Sets new selected header
         * @param {Object} item - new selected item
         */
        function onSelectHeader(item) {
            lodash.set(ctrl.workingCopy, 'spec.attributes.headers.Content-Type', item.id);
            ctrl.contentType = item.id;

            isFormChanged();
        }

        /**
         * Callback from body field.
         */
        function onChangeBody() {
            isFormChanged();
        }

        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.workingCopy, 'spec.body', sourceCode);

            isFormChanged();
        }

        //
        // Private methods
        //

        /**
         * Compares original object and working object to get know if fields was changed
         * Also check if form valid and set result to corresponding variable
         */
        function isFormChanged() {
            $timeout(function () {
                ctrl.isFormChanged = !lodash.isEqual(ctrl.workingCopy, ctrl.selectedEvent) && lodash.isEmpty(ctrl.functionEventForm.$error);
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionCodeController.$inject = ['$element', '$rootScope', '$scope', '$timeout', '$i18next', 'i18next', 'lodash', 'Base64', 'ConfigService', 'DialogsService', 'VersionHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionCode', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-code/version-code.tpl.html',
        controller: NclVersionCodeController
    });

    function NclVersionCodeController($element, $rootScope, $scope, $timeout, $i18next, i18next, lodash, Base64, ConfigService, DialogsService, VersionHelperService) {
        var ctrl = this;
        var scrollContainer = null;
        var previousEntryType = null;
        var testPaneWidth = 650;
        var isAnimationCompleted = true;
        var lng = i18next.language;

        ctrl.githubToken = '';
        ctrl.scrollConfig = {
            axis: 'xy',
            advanced: {
                autoScrollOnFocus: false
            }
        };
        ctrl.scrollConfigHorizontal = {
            axis: 'x',
            advanced: {
                autoScrollOnFocus: false
            },
            callbacks: {
                onCreate: function onCreate() {
                    scrollContainer = this.querySelector('.mCSB_container');
                    scrollContainer.style.height = '100%';
                }
            }
        };
        ctrl.codeEntryTypeArray = [{
            id: 'sourceCode',
            visible: true,
            name: 'Edit online'
        }, {
            id: 'image',
            visible: true,
            name: 'Image',
            defaultValues: {
                spec: {
                    image: ''
                }
            }
        }, {
            id: 'archive',
            visible: true,
            name: 'Archive',
            defaultValues: {
                spec: {
                    build: {
                        path: '',
                        codeEntryAttributes: {
                            headers: {
                                'X-V3io-Session-Key': ''
                            },
                            workDir: ''
                        }
                    }
                }
            }
        }, {
            id: 'github',
            visible: true,
            name: 'GitHub',
            defaultValues: {
                spec: {
                    build: {
                        path: '',
                        codeEntryAttributes: {
                            branch: '',
                            headers: {
                                'Authorization': ''
                            },
                            workDir: ''
                        }
                    }
                }
            }
        }, {
            id: 'jar',
            visible: lodash.get(ctrl.version, 'spec.runtime') === 'java',
            name: 'Jar',
            defaultValues: {
                spec: {
                    build: {
                        path: ''
                    }
                }
            }
        }, {
            id: 's3',
            visible: true,
            name: 'S3',
            defaultValues: {
                spec: {
                    build: {
                        codeEntryAttributes: {
                            s3Bucket: '',
                            s3ItemKey: '',
                            s3AccessKeyId: '',
                            s3SecretAccessKey: '',
                            s3Region: '',
                            s3SessionToken: '',
                            workDir: ''
                        }
                    }
                }
            }
        }];
        ctrl.themesArray = [{
            id: 'vs',
            name: 'Light',
            visible: true
        }, {
            id: 'vs-dark',
            name: 'Dark',
            visible: true
        }];
        ctrl.selectedTheme = lodash.get(ctrl.version, 'ui.editorTheme', ctrl.themesArray[0]);

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onChangeGithubToken = onChangeGithubToken;
        ctrl.onChangeSourceCode = onChangeSourceCode;
        ctrl.selectEntryTypeValue = selectEntryTypeValue;
        ctrl.selectRuntimeValue = selectRuntimeValue;
        ctrl.selectThemeValue = selectThemeValue;

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.runtimeArray = getRuntimes();
            ctrl.selectedRuntime = lodash.find(ctrl.runtimeArray, ['id', ctrl.version.spec.runtime]);
            ctrl.editorLanguage = ctrl.selectedRuntime.language;

            var sourceCode = lodash.get(ctrl.version, 'spec.build.functionSourceCode', '');
            if (lodash.isEmpty(sourceCode)) {
                ctrl.sourceCode = lodash.get(ctrl.version, 'ui.versionCode', sourceCode);
            } else {
                ctrl.sourceCode = Base64.decode(sourceCode);

                lodash.set(ctrl.version, 'ui.versionCode', sourceCode);
            }

            if (lodash.has(ctrl.version, 'spec.build.codeEntryType')) {
                ctrl.selectedEntryType = lodash.find(ctrl.codeEntryTypeArray, ['id', ctrl.version.spec.build.codeEntryType]);
                if (ctrl.selectedEntryType.id === 'github') {
                    ctrl.githubToken = lodash.chain(ctrl.version.spec.build).get('codeEntryAttributes.headers', {}).find(function (value, key) {
                        return key.toLowerCase() === 'authorization';
                    }).defaultTo('token ').value().split(/\s+/g)[1];
                }
            } else {
                ctrl.selectedEntryType = ctrl.codeEntryTypeArray[0];
                lodash.set(ctrl.version, 'spec.build.codeEntryType', ctrl.selectedEntryType.id);
            }

            previousEntryType = ctrl.selectedEntryType;

            $scope.$on('ui.layout.resize', onLayoutResize);
            $scope.$on('navigation-tabs_toggle-test-pane', toggleTestPane);
        }

        /**
         * Post linking method
         */
        function postLink() {
            $timeout(onDragNDropFile);
        }

        //
        // Public methods
        //

        /**
         * Sets new value to entity type and prepares the relevant fields for this type.
         * @param {Object} item - the selected option of "Code Entry Type" drop-down field.
         */
        function selectEntryTypeValue(item) {
            ctrl.selectedEntryType = item;

            lodash.set(ctrl.version, 'spec.build.codeEntryType', ctrl.selectedEntryType.id);
            var functionSourceCode = lodash.get(ctrl.version, 'spec.build.functionSourceCode', '');

            // delete the following paths ...
            lodash.forEach(['spec.image', 'spec.build.codeEntryAttributes', 'spec.build.path', 'spec.build.functionSourceCode'], lodash.unset.bind(lodash, ctrl.version));

            // ... then fill only the relevant ones with default value according to the selected option
            lodash.merge(ctrl.version, item.defaultValues);

            if (item.id === 'sourceCode') {

                // restore source code that was preserved in memory - if such exists
                var savedSourceCode = lodash.get(ctrl.version, 'ui.versionCode', '');
                lodash.set(ctrl.version, 'spec.build.functionSourceCode', savedSourceCode);
                ctrl.sourceCode = Base64.decode(savedSourceCode);

                if (!lodash.isNil(scrollContainer)) {
                    $timeout(function () {
                        scrollContainer.style.height = '100%';
                    });
                }

                $rootScope.$broadcast('change-state-deploy-button', { component: 'code', isDisabled: false });
            } else {

                // preserve source code (for later using it if the user selects "Edit Online" option)
                if (previousEntryType.id === 'sourceCode') {
                    lodash.set(ctrl.version, 'ui.versionCode', functionSourceCode);
                }

                // disable "Deploy" button if required fields of the selected option are empty
                if (item.id === 'image' && lodash.isEmpty(ctrl.version.spec.image) || item.id !== 'image' && lodash.isEmpty(ctrl.version.spec.build.path)) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'code', isDisabled: true });
                }
            }

            previousEntryType = ctrl.selectedEntryType;
        }

        /**
         * Sets new selected theme for editor
         * @param {Object} item
         */
        function selectThemeValue(item) {
            ctrl.version.ui.editorTheme = item;
            ctrl.selectedTheme = item;
        }

        /**
         * Sets new value to runtime
         * @param {Object} item
         */
        function selectRuntimeValue(item) {
            ctrl.selectedRuntime = item;
            ctrl.editorLanguage = ctrl.selectedRuntime.language;

            lodash.set(ctrl.version, 'spec.runtime', item.id);
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', item.sourceCode);
            lodash.set(ctrl.version, 'ui.versionCode', item.sourceCode);

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        function onChangeGithubToken(newData) {
            ctrl.githubToken = newData;
            lodash.unset(ctrl.version, 'spec.build.codeEntryAttributes.headers.authorization');
            lodash.set(ctrl.version, 'spec.build.codeEntryAttributes.headers.Authorization', 'token ' + newData);
        }

        /**
         * Changes function`s source code
         * @param {string} sourceCode
         */
        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', Base64.encode(sourceCode));
            lodash.set(ctrl.version, 'ui.versionCode', Base64.encode(sourceCode));

            ctrl.sourceCode = sourceCode;

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);
            VersionHelperService.updateIsVersionChanged(ctrl.version);

            $timeout(function () {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'code',
                    isDisabled: ctrl.versionCodeForm.$invalid
                });
            });
        }

        //
        // Private methods
        //

        /**
         * Extracts a file name from a provided path
         * @param {string} path - the path including a file name (delimiters: '/' or '\' or both, can be consecutive)
         * @param {boolean} [includeExtension=true] - set to `true` to include extension, or `false` to exclude it
         * @param {boolean} [onlyExtension=false] - set to `true` to include extension only, or `false` to include file
         *     name
         * @returns {string} the file name at the end of the given path with or without its extension (depending on the
         *     value of `extension` parameter)
         *
         * @example
         * ```js
         * extractFileName('/path/to/file/file.name.ext');
         * // => 'file.name.ext'
         *
         * extractFileName('\\path/to\\file/file.name.ext', false);
         * // => 'file.name'
         *
         * extractFileName('file.name.ext', false);
         * // => 'file.name'
         *
         * extractFileName('/path/to/////file\\\\\\\\file.name.ext', true);
         * // => 'file.name.ext'
         *
         * extractFileName('/path/to/file\file.name.ext', true, true);
         * // => 'ext'
         *
         * extractFileName('/path/to/file/file.name.ext', false, true);
         * // => '.'
         *
         * extractFileName('');
         * // => ''
         *
         * extractFileName(undefined);
         * // => ''
         *
         * extractFileName(null);
         * // => ''
         * ```
         */
        function extractFileName(path, includeExtension, onlyExtension) {
            var start = path.lastIndexOf(lodash.defaultTo(onlyExtension, false) ? '.' : '/') + 1;
            var end = lodash.defaultTo(includeExtension, true) ? path.length : path.lastIndexOf('.');

            return lodash.defaultTo(path, '').replace('\\', '/').substring(start, end);
        }

        /**
         * Gets all runtimes
         * @returns {Array}
         */
        function getRuntimes() {

            // language identifiers for monaco editor are taken from:
            // https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
            return [{
                id: 'golang',
                ext: 'go',
                name: 'Go',
                language: 'go',
                sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' + 'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' + '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                visible: true
            }, {
                id: 'python:2.7',
                ext: 'py',
                name: 'Python 2.7',
                language: 'python',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'python:3.6',
                ext: 'py',
                name: 'Python 3.6',
                language: 'python',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'dotnetcore',
                ext: 'cs',
                name: '.NET Core',
                language: 'csharp',
                sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' + 'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' + '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' + 'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' + 'fQ==', // source code in base64
                visible: true
            }, {
                id: 'java',
                ext: 'java',
                name: 'Java',
                language: 'java',
                sourceCode: 'aW1wb3J0IGlvLm51Y2xpby5Db250ZXh0Ow0KaW1wb3J0IGlvLm51Y2xpby5FdmVudDsNCmltcG9ydCBpby5udWN' + 'saW8uRXZlbnRIYW5kbGVyOw0KaW1wb3J0IGlvLm51Y2xpby5SZXNwb25zZTsNCg0KcHVibGljIGNsYXNzIEhhbmRsZXIgaW1wbG' + 'VtZW50cyBFdmVudEhhbmRsZXIgew0KDQogICAgQE92ZXJyaWRlDQogICAgcHVibGljIFJlc3BvbnNlIGhhbmRsZUV2ZW50KENvb' + 'nRleHQgY29udGV4dCwgRXZlbnQgZXZlbnQpIHsNCiAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCkuc2V0Qm9keSgiIik7DQog' + 'ICAgfQ0KfQ==',
                visible: true
            }, {
                id: 'nodejs',
                ext: 'js',
                language: 'javascript',
                sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' + 'rKCcnKTsNCn07', // source code in base64
                name: 'NodeJS',
                visible: true
            }, {
                id: 'shell',
                ext: 'sh',
                name: 'Shell',
                language: 'shellscript',
                sourceCode: '',
                visible: true
            }, {
                id: 'ruby',
                ext: 'rb',
                name: 'Ruby',
                language: 'ruby',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpDQplbmQ=', // source code in base64
                visible: true
            }];
        }

        /**
         * Tests whether a file is valid for dropping in code editor according to its MIME type and its extension
         * @param {string} type - the MIME type of the file (e.g. 'text/plain', 'application/javascript')
         * @param {string} extension - the extension of the file (e.g. 'txt', 'py', 'html')
         * @returns {boolean} `true` if the file is valid for dropping in code editor, or `false` otherwise
         */
        function isFileDropValid(type, extension) {

            // Drag'n'Drop textual files into the code editor
            var validFileExtensions = ['cs', 'py', 'go', 'sh', 'txt', 'js', 'java'];

            return lodash(type).startsWith('text/') || validFileExtensions.includes(extension);
        }

        /**
         * Sets informational background over monaco editor before dropping a file
         */
        function onDragNDropFile() {
            var codeEditor = $element.find('.monaco-code-editor');
            var nclMonaco = $element.find('.ncl-monaco');
            var codeEditorDropZone = $element.find('.code-editor-drop-zone');

            // Register event handlers for drag'n'drop of files to code editor
            codeEditor.on('dragover', null, false).on('dragenter', null, function (event) {
                codeEditorDropZone.addClass('dragover');

                codeEditor.css('opacity', '0.4');
                event.preventDefault();
            }).on('dragleave', null, function (event) {
                var monacoCoords = nclMonaco[0].getBoundingClientRect();

                if (event.originalEvent.pageX <= monacoCoords.left || event.originalEvent.pageX >= monacoCoords.right || event.originalEvent.pageY >= monacoCoords.bottom || event.originalEvent.pageY <= monacoCoords.top) {
                    codeEditorDropZone.removeClass('dragover');
                    codeEditor.css('opacity', '');
                }

                event.preventDefault();
            }).on('drop', null, function (event) {
                var itemType = lodash.get(event, 'originalEvent.dataTransfer.items[0].type');
                var file = lodash.get(event, 'originalEvent.dataTransfer.files[0]');
                var extension = extractFileName(file.name, true, true);

                if (isFileDropValid(itemType, extension)) {
                    var reader = new FileReader();

                    reader.onload = function (onloadEvent) {
                        var functionSource = {
                            language: lodash.chain(ctrl.runtimeArray).find(['ext', extension]).defaultTo({
                                language: 'plaintext'
                            }).value().language,
                            code: onloadEvent.target.result
                        };
                        ctrl.sourceCode = functionSource.code;
                        ctrl.editorLanguage = functionSource.language;
                        $scope.$apply();

                        codeEditorDropZone.removeClass('dragover');
                        codeEditor.css('opacity', '');
                    };
                    reader.onerror = function () {
                        DialogsService.alert($i18next.t('functions.ERROR_MSG:COULD_NOT_READ_FILE', { lng: lng }));
                    };
                    reader.readAsText(file);
                } else {
                    codeEditorDropZone.removeClass('dragover');
                    codeEditor.css('opacity', '');

                    DialogsService.alert($i18next.t('common:INVALID_FILE_TYPE_EXTENSION', { lng: lng }));
                }
                event.preventDefault();
            });
        }

        /**
         * Broadcast callback from angular-ui-layout.
         * Sets new width of test pane.
         * @param event
         * @param beforeContainerResize
         * @param afterContainerResize
         */
        function onLayoutResize(event, beforeContainerResize, afterContainerResize) {
            testPaneWidth = afterContainerResize.size;

            resizeScrollBar(100);
        }

        /**
         * Resize scrollbar container.
         * Layout directive (splitter) makes changes to width of scrollbar container. But scrollbar doesn't handle
         * those changes in correct way. So we have to set width manually
         * @param {number} timeout - function invocation delay
         */
        function resizeScrollBar(timeout) {
            $timeout(function () {
                var CODE_CONTAINER_MIN_WIDTH = 700;

                // if scrollbar container is wider than minimal code container width (scrollbar is not needed)
                if (angular.element($element.find('.code-scrollable-container')).width() >= CODE_CONTAINER_MIN_WIDTH) {
                    // make sure that scrollbar container takes all available width
                    angular.element($element.find('.mCSB_container')[0]).css('width', '100%');

                    // hide scrollbar (make it disabled)
                    angular.element($element.find('.igz-scrollable-container')[0]).mCustomScrollbar('disable', true);
                } else {
                    // set code's container minimal width to scrollbar container
                    angular.element($element.find('.mCSB_container')[0]).css('width', CODE_CONTAINER_MIN_WIDTH + 'px');
                }

                $timeout(function () {
                    // Enable scrolling again or show scrollbar
                    angular.element($element.find('.igz-scrollable-container')[0]).mCustomScrollbar('update');
                }, 100);
            }, timeout);
        }

        /**
         * Broadcast's callback to toggle test pane
         * @param {Event} event - native broadcast event object
         * @param {Object} data - contains data of test pane state (closed/opened)
         */
        function toggleTestPane(event, data) {
            if (isAnimationCompleted) {
                if (data.closeTestPane) {
                    closeTestPane();
                } else {
                    openTestPane();
                }
            }

            /**
             * Closes Test pane
             */
            function closeTestPane() {
                isAnimationCompleted = false;
                var testPaneLeftPosition = parseInt(angular.element('.event-pane-section').css('left'));
                var codeSectionWidth = parseInt(angular.element('.code-section').css('width'));

                // move Test pane to left
                angular.element('.event-pane-section').animate({
                    'left': testPaneLeftPosition + testPaneWidth
                }, {
                    complete: onCloseCompleteAnimation
                });

                // resize code section to full width
                angular.element('.code-section').animate({
                    'width': codeSectionWidth + testPaneWidth + 'px'
                }, 500);

                // hide splitter
                angular.element(angular.element('.ui-splitbar')[0]).css('display', 'none');

                resizeScrollBar(500);

                /**
                 * jQuery complete animation callback.
                 * Hide Test pane when animation is completed
                 */
                function onCloseCompleteAnimation() {

                    // hide Test pane
                    angular.element('.event-pane-section').css('display', 'none');

                    isAnimationCompleted = true;
                }
            }

            /**
             * Opens Test pane
             */
            function openTestPane() {
                isAnimationCompleted = false;
                var codeSectionWidth = parseInt(angular.element('.code-section').css('width'));

                // show Test pane
                angular.element('.event-pane-section').css('display', 'block');

                var testPaneLeftPosition = parseInt(angular.element('.event-pane-section').css('left'));

                // resize code section
                angular.element('.code-section').animate({
                    'width': codeSectionWidth - testPaneWidth + 'px'
                });

                // move Test pane to be visible on the screen
                angular.element('.event-pane-section').animate({
                    'left': testPaneLeftPosition - testPaneWidth
                }, {
                    complete: onOpenCompleteAnimation
                });

                resizeScrollBar(500);

                /**
                 * jQuery complete animation callback.
                 * Shows splitter, when animation is completed
                 */
                function onOpenCompleteAnimation() {
                    angular.element(angular.element('.ui-splitbar')[0]).css('display', 'block');

                    isAnimationCompleted = true;
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationController.$inject = ['lodash', 'ConfigService', 'VersionHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfiguration', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/version-configuration.tpl.html',
        controller: NclVersionConfigurationController
    });

    function NclVersionConfigurationController(lodash, ConfigService, VersionHelperService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.isRuntimeBlockVisible = isRuntimeBlockVisible;
        ctrl.onConfigurationChangeCallback = onConfigurationChangeCallback;

        //
        // Public methods
        //

        /**
         * Checks if `Runtime Attributes` block is visible
         * @returns {boolean}
         */
        function isRuntimeBlockVisible() {
            return lodash.includes(['shell', 'java'], lodash.get(ctrl.version, 'spec.runtime'));
        }

        /**
         * Checks if version's configuration was changed
         */
        function onConfigurationChangeCallback() {
            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionMonitoringController.$inject = ['$rootScope', '$scope', '$timeout', 'lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionMonitoring', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-monitoring/version-monitoring.tpl.html',
        controller: NclVersionMonitoringController
    });

    function NclVersionMonitoringController($rootScope, $scope, $timeout, lodash, ConfigService) {
        var ctrl = this;

        ctrl.versionStatus = {};
        ctrl.scrollConfig = {
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.loggerScrollConfig = {
            advanced: {
                updateOnContentResize: true
            },
            theme: 'light-thin'
        };
        ctrl.rowIsCollapsed = {
            buildLog: false,
            errorLog: false
        };

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.checkIsErrorState = checkIsErrorState;
        ctrl.onRowCollapse = onRowCollapse;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            setVersionStatus();

            $scope.$on('deploy-result-changed', setVersionStatus);
        }

        //
        // Public methods
        //

        /**
         * Checks if current version status is `error`
         * @returns {boolean}
         */
        function checkIsErrorState() {
            return lodash.get(ctrl.versionStatus, 'state') === 'error';
        }

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            }, 350);
        }

        //
        // Private methods
        //

        /**
         * Sets actual deploying status in `ctrl.versionStatus`
         */
        function setVersionStatus() {
            if (lodash.isEmpty(lodash.get(ctrl.version, 'ui.deployResult'))) {
                ctrl.versionStatus = lodash.get(ctrl.version, 'status');
            } else {
                ctrl.versionStatus = lodash.get(ctrl.version, 'ui.deployResult.status');
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionTriggersController.$inject = ['$rootScope', '$timeout', '$i18next', 'i18next', 'lodash', 'DialogsService', 'VersionHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionTriggers', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-triggers/version-triggers.tpl.html',
        controller: NclVersionTriggersController
    });

    function NclVersionTriggersController($rootScope, $timeout, $i18next, i18next, lodash, DialogsService, VersionHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isCreateModeActive = false;
        ctrl.triggers = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;
        ctrl.createTrigger = createTrigger;
        ctrl.editTriggerCallback = editTriggerCallback;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // get trigger list
            ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                var triggersItem = angular.copy(value);
                triggersItem.id = key;
                triggersItem.name = key;

                triggersItem.ui = {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'trigger'
                };

                triggersItem.attributes = lodash.defaultTo(triggersItem.attributes, {});

                if (value.kind === 'cron') {
                    var scheduleValueArray = lodash.chain(triggersItem).get('attributes.schedule', '').split(' ').value();

                    if (scheduleValueArray.length === 6) {
                        triggersItem.attributes.schedule = lodash.chain(scheduleValueArray).takeRight(5).join(' ').value();
                    }
                }

                return triggersItem;
            });

            $timeout(function () {
                ctrl.defaultFields = {
                    ingressHost: ctrl.version.ui.ingressHost
                };
            }, 1000);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: false });
        }

        //
        // Public methods
        //

        /**
         * Toggle create trigger mode
         * @returns {Promise}
         */
        function createTrigger(event) {
            $timeout(function () {
                if (!isTriggerInEditMode()) {
                    ctrl.triggers.push({
                        id: '',
                        name: '',
                        kind: '',
                        attributes: {},
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'trigger'
                        }
                    });
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: true });
                    event.stopPropagation();
                }
            }, 100);
        }

        /**
         * Edit trigger callback function
         * @returns {Promise}
         */
        function editTriggerCallback(item) {
            ctrl.handleAction('update', item);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} selectedItem - an object of selected trigger
         * @returns {Promise}
         */
        function handleAction(actionType, selectedItem) {
            if (actionType === 'delete') {
                deleteHandler(selectedItem);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTIONALITY_IS_NOT_IMPLEMENTED', { lng: lng }));
            }

            $rootScope.$broadcast('change-state-deploy-button', { component: 'trigger', isDisabled: false });
            lodash.forEach(ctrl.triggers, function (trigger) {
                if (!trigger.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: trigger.ui.name, isDisabled: true });
                }
            });

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        //
        // Private methods
        //

        /**
         * Deletes selected item
         * @param {Array} selectedItem - an object of selected trigger
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.triggers, ['id', selectedItem.id]);
            lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
        }

        /**
         * Toggles item to edit mode
         * @param {Array} selectedItem - an object of selected trigger
         */
        function editHandler(selectedItem) {
            var aTrigger = lodash.find(ctrl.triggers, ['id', selectedItem.id]);
            aTrigger.ui.editModeActive = true;
        }

        /**
         * Updates data in selected item
         * @param {Array} selectedItem - an object of selected trigger
         */
        // eslint-disable-next-line
        function updateHandler(selectedItem) {
            var currentTrigger = lodash.find(ctrl.triggers, ['id', selectedItem.id]);

            if (!lodash.isEmpty(selectedItem.id)) {
                lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
            }

            var triggerItem = {
                kind: selectedItem.kind,
                attributes: selectedItem.attributes
            };

            if (angular.isDefined(selectedItem.workerAllocatorName)) {
                triggerItem.workerAllocatorName = selectedItem.workerAllocatorName;
            }

            if (angular.isDefined(selectedItem.url)) {
                triggerItem.url = selectedItem.url;
            }

            if (angular.isDefined(selectedItem.maxWorkers)) {
                triggerItem.maxWorkers = Number(selectedItem.maxWorkers);
            }

            if (angular.isDefined(selectedItem.workerAvailabilityTimeoutMilliseconds)) {
                triggerItem.workerAvailabilityTimeoutMilliseconds = Number(selectedItem.workerAvailabilityTimeoutMilliseconds);
            }

            if (angular.isDefined(selectedItem.username)) {
                triggerItem.username = selectedItem.username;
            }

            if (angular.isDefined(selectedItem.password)) {
                triggerItem.password = selectedItem.password;
            }

            if (angular.isDefined(selectedItem.attributes.event)) {
                if (lodash.isEmpty(triggerItem.attributes.event.body)) {
                    delete triggerItem.attributes.event.body;
                }

                if (!lodash.isEmpty(selectedItem.attributes.event.body)) {
                    triggerItem.attributes.event.body = selectedItem.attributes.event.body;
                }

                if (lodash.isEmpty(triggerItem.attributes.event.headers)) {
                    delete triggerItem.attributes.event.headers;
                }

                if (!lodash.isEmpty(selectedItem.attributes.event.headers)) {
                    triggerItem.attributes.event.headers = angular.copy(selectedItem.attributes.event.headers);
                }
            }

            if (angular.isDefined(triggerItem.attributes)) {
                triggerItem.attributes = lodash.omitBy(triggerItem.attributes, function (attribute) {
                    return !lodash.isNumber(attribute) && lodash.isEmpty(attribute);
                });

                if (angular.isDefined(triggerItem.attributes.schedule)) {
                    triggerItem.attributes.schedule = '0 ' + triggerItem.attributes.schedule;
                }

                if (lodash.isEmpty(triggerItem.attributes)) {
                    triggerItem = lodash.omit(triggerItem, 'attributes');
                }
            }

            if (angular.isDefined(selectedItem.annotations)) {
                triggerItem.annotations = selectedItem.annotations;
            }

            lodash.set(ctrl.version, 'spec.triggers.' + selectedItem.name, triggerItem);

            selectedItem.id = selectedItem.name;

            if (!lodash.isEqual(currentTrigger, selectedItem)) {
                angular.copy(selectedItem, currentTrigger);
            }
        }

        /**
         * Check if trigger is in edit mode
         * @returns {boolean}
         */
        function isTriggerInEditMode() {
            var triggerInEditMode = false;
            ctrl.triggers.forEach(function (trigger) {
                if (trigger.ui.editModeActive) {
                    triggerInEditMode = true;
                }
            });
            return triggerInEditMode;
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
/* eslint complexity: ["error", 15] */
(function () {
    'use strict';

    NclFunctionEventPaneController.$inject = ['$element', '$rootScope', '$scope', '$timeout', '$q', '$i18next', 'i18next', 'lodash', 'moment', 'download', 'ConverterService', 'DialogsService', 'EventHelperService', 'VersionHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionEventPane', {
        bindings: {
            version: '<',
            createFunctionEvent: '&',
            getExternalIpAddresses: '&',
            getFunctionEvents: '&',
            deleteFunctionEvent: '&',
            invokeFunction: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/function-event-pane.tpl.html',
        controller: NclFunctionEventPaneController
    });

    function NclFunctionEventPaneController($element, $rootScope, $scope, $timeout, $q, $i18next, i18next, lodash, moment, download, ConverterService, DialogsService, EventHelperService, VersionHelperService) {
        var ctrl = this;

        var canceler = null;
        var canceledInvocation = false;
        var HISTORY_LIMIT = 100;
        var lng = i18next.language;

        ctrl.createEvent = true;
        ctrl.externalIPAddress = '';
        ctrl.headers = [];
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.leftBarNavigationTabs = [{
            id: 'saved',
            tabName: $i18next.t('functions:SAVED', { lng: lng })
        }, {
            id: 'history',
            tabName: $i18next.t('functions:HISTORY', { lng: lng })
        }];
        ctrl.logs = [];
        ctrl.requestMethods = [{
            id: 'post',
            name: 'POST',
            visible: true
        }, {
            id: 'get',
            name: 'GET',
            visible: true
        }, {
            id: 'put',
            name: 'PUT',
            visible: true
        }, {
            id: 'gelete',
            name: 'DELETE',
            visible: true
        }, {
            id: 'patch',
            name: 'PATCH',
            visible: true
        }];
        ctrl.requestNavigationTabs = [{
            id: 'body',
            tabName: $i18next.t('functions:BODY', { lng: lng })
        }, {
            id: 'headers',
            tabName: $i18next.t('functions:HEADERS', { lng: lng })
        }];
        ctrl.requestBodyTypes = [{
            id: 'text',
            name: 'Text',
            visible: true
        }, {
            id: 'json',
            name: 'JSON',
            visible: true
        }, {
            id: 'file',
            name: 'File',
            visible: true
        }];
        ctrl.requestBodyType = ctrl.requestBodyTypes[0];
        ctrl.requestSourceCodeLanguage = 'plaintext';
        ctrl.requestSourceCode = '';
        ctrl.responseNavigationTabs = [{
            id: 'body',
            tabName: $i18next.t('functions:BODY', { lng: lng })
        }, {
            id: 'headers',
            tabName: $i18next.t('functions:HEADERS', { lng: lng }),
            badge: 0
        }, {
            id: 'logs',
            tabName: $i18next.t('common:LOGS', { lng: lng }),
            badge: 0
        }];
        ctrl.responseImage = null;
        ctrl.selectedEvent = {};
        ctrl.selectedRequestTab = ctrl.responseNavigationTabs[0];
        ctrl.selectedResponseTab = ctrl.responseNavigationTabs[0];
        ctrl.selectedLeftBarTab = ctrl.leftBarNavigationTabs[0];
        ctrl.showLeftBar = false;
        ctrl.igzScrollConfig = {
            maxElementsCount: 4,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.showResponse = false;
        ctrl.testResult = {};
        ctrl.uploadingData = {
            uploading: false,
            uploaded: false,
            progress: '0%',
            name: ''
        };

        ctrl.$onInit = onInit;

        ctrl.addNewHeader = addNewHeader;
        ctrl.cancelInvocation = cancelInvocation;
        ctrl.downloadResponseFile = downloadResponseFile;
        ctrl.deleteEvent = deleteEvent;
        ctrl.deleteFile = deleteFile;
        ctrl.fixLeftBar = fixLeftBar;
        ctrl.getInvocationUrl = getInvocationUrl;
        ctrl.getMethodColor = getMethodColor;
        ctrl.handleAction = handleAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isDisabledTestButton = isDisabledTestButton;
        ctrl.onChangeData = onChangeData;
        ctrl.onChangeLogLevel = onChangeLogLevel;
        ctrl.onChangeRequestBodyType = onChangeRequestBodyType;
        ctrl.onChangeRequestMethod = onChangeRequestMethod;
        ctrl.onChangeRequestSourceCode = onChangeRequestSourceCode;
        ctrl.onChangeTab = onChangeTab;
        ctrl.resetData = resetData;
        ctrl.saveEvent = saveEvent;
        ctrl.selectEvent = selectEvent;
        ctrl.testEvent = testEvent;
        ctrl.toggleLeftBar = toggleLeftBar;
        ctrl.uploadFile = uploadFile;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isSplashShowed.value = true;
            ctrl.eventLogLevel = 'debug';

            if (lodash.isNil(ctrl.version.ui.deployedVersion)) {
                VersionHelperService.updateIsVersionChanged(ctrl.version);
            }

            updateHistory();

            lodash.defaultsDeep(ctrl.selectedEvent, {
                metadata: {
                    namespace: lodash.get(ctrl.version, 'metadata.namespace'),
                    labels: {
                        'nuclio.io/function-name': lodash.get(ctrl.version, 'metadata.name')
                    }
                },
                spec: {
                    displayName: '',
                    triggerKind: 'http',
                    attributes: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain'
                        },
                        path: ''
                    },
                    body: ''
                }
            });

            ctrl.getFunctionEvents({ functionData: ctrl.version }).then(function (response) {
                ctrl.savedEvents = response;
            }).catch(function () {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.GET_EVENTS', { lng: lng }));
            }).finally(function () {
                ctrl.isSplashShowed.value = false;
            });

            ctrl.getExternalIpAddresses().then(function (result) {
                ctrl.externalIPAddress = lodash.get(result, 'externalIPAddresses.addresses[0]', '');
            }).catch(function () {
                ctrl.version.ui.invocationURL = '';
            });

            updateRequestHeaders();
        }

        //
        // Public methods
        //

        /**
         * Adds new header
         */
        function addNewHeader(event) {
            $timeout(function () {
                if (ctrl.headers.length < 1 || lodash.last(ctrl.headers).ui.isFormValid) {
                    ctrl.headers.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'header',
                            checked: true
                        }
                    });

                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Cancels invoke request
         */
        function cancelInvocation() {
            if (canceler !== null) {
                canceler.resolve();
                canceler = null;
            }
            canceledInvocation = true;
        }

        /**
         * Downloads response body file
         */
        function downloadResponseFile() {
            var fileName = ctrl.selectedEvent.spec.displayName + '_' + moment.utc().format('YYYY-MM-DDThh-mm-ss');
            var contentType = lodash.get(ctrl.testResult.headers, 'content-type', lodash.get(ctrl.testResult.headers, 'Content-Type', null));
            var textualFile = lodash.includes(contentType, 'text') || contentType === 'application/json';

            if (textualFile) {
                download.fromData(ctrl.testResult.body, contentType, fileName);
            } else {
                download.fromBlob(ctrl.testResult.body, fileName);
            }
        }

        /**
         * Deletes selected event
         * @param {Object} event
         */
        function deleteEvent(event) {
            var dialogConfig = {
                message: {
                    message: $i18next.t('functions:DELETE_EVENT', { lng: lng }) + ' “' + event.spec.displayName + '”?',
                    description: $i18next.t('functions:DELETE_EVENT_DESCRIPTION', { lng: lng })
                },
                yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                type: 'nuclio_alert'
            };

            DialogsService.confirm(dialogConfig.message, dialogConfig.yesLabel, dialogConfig.noLabel, dialogConfig.type).then(function () {
                var eventData = {
                    metadata: {
                        name: event.metadata.name,
                        namespace: event.metadata.namespace
                    }
                };
                ctrl.isSplashShowed.value = true;

                ctrl.deleteFunctionEvent({ eventData: eventData }).then(function () {

                    // update test events list
                    ctrl.getFunctionEvents({ functionData: ctrl.version }).then(function (response) {
                        ctrl.savedEvents = response;

                        if (event.metadata.name === ctrl.selectedEvent.metadata.name) {
                            resetData();
                        }
                    }).catch(function (error) {
                        var msg = $i18next.t('functions:ERROR_MSG.GET_EVENTS', { lng: lng });
                        DialogsService.alert(lodash.get(error, 'data.error', msg));
                    });
                }).catch(function (error) {
                    var msg = $i18next.t('functions:ERROR_MSG.DELETE_EVENTS', { lng: lng });
                    DialogsService.alert(lodash.get(error, 'data.error', msg));
                }).finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
            });
        }

        /**
         * Deletes uploaded file
         */
        function deleteFile() {
            ctrl.uploadingData = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                name: ''
            };

            ctrl.selectedEvent.spec.body = '';
            ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = '';

            updateRequestHeaders();
        }

        /**
         * Sets left bar as fixed
         */
        function fixLeftBar() {
            ctrl.fixedLeftBar = true;
        }

        /**
         * Gets invocation url
         * @returns {string}
         */
        function getInvocationUrl() {
            var httpPort = lodash.get(ctrl.version, 'ui.deployResult.status.httpPort', null);

            if (lodash.isNil(httpPort)) {
                httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            }

            if (httpPort && lodash.includes(['building', 'error'], lodash.get(ctrl.version, 'ui.deployResult.status.state'))) {
                httpPort = null;
            }

            setInvocationUrl(ctrl.externalIPAddress, httpPort);

            return lodash.isNull(httpPort) ? $i18next.t('functions:NOT_YET_DEPLOYED', { lng: lng }) : ctrl.version.ui.invocationURL + '/';
        }

        /**
         * Gets color depends on request method type
         * @param {string} method
         * @returns {string}
         */
        function getMethodColor(method) {
            return method === 'POST' ? '#fdbc5a' : method === 'GET' ? '#21d4ac' : method === 'PUT' ? '#239bca' : method === 'DELETE' ? '#e54158' : '#96a8d3';
        }

        /**
         * Handler on specific action type for key-value input
         * @param {string} actionType
         * @param {number} index - index of label in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.headers.splice(index, 1);

                updateHeaders();
            }
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.selectedEvent, field, newData);

            updateRequestHeaders();
        }

        /**
         * Checks if `Test` button should be disabled
         * @returns {boolean}
         */
        function isDisabledTestButton() {
            var httpPort = lodash.get(ctrl.version, 'ui.deployResult.status.httpPort', null);

            if (lodash.get(ctrl.version, 'status.state') === 'ready' && lodash.get(ctrl.version, 'spec.disable')) {
                return true;
            }

            if (lodash.isNil(httpPort)) {
                httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            }

            if (httpPort && lodash.includes(['building', 'error'], lodash.get(ctrl.version, 'ui.deployResult.status.state'))) {
                httpPort = null;
            }

            return lodash.isNull(httpPort) || ctrl.uploadingData.uploading || ctrl.testing;
        }

        /**
         * Changes headers data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.headers[index] = label;

            updateHeaders();
        }

        /**
         * Changes log level data
         * @param {Object} selectedLogLevel - selected log level
         */
        function onChangeLogLevel(selectedLogLevel) {
            ctrl.eventLogLevel = selectedLogLevel.id;
        }

        /**
         * Changes function's test request type of body (text, json, file)
         * @param {Object} bodyType
         */
        function onChangeRequestBodyType(bodyType) {
            ctrl.requestBodyType = bodyType;
            ctrl.selectedEvent.spec.body = '';

            if (bodyType.id === 'file') {
                $timeout(onDragNDropFileToBody);
            } else {
                ctrl.uploadingData = {
                    uploading: false,
                    uploaded: false,
                    progress: '0%',
                    name: ''
                };

                ctrl.requestSourceCodeLanguage = bodyType.id === 'json' ? 'json' : 'textplain';
                ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = bodyType.id === 'json' ? 'application/json' : 'text/plain';

                updateRequestHeaders();
            }
        }

        /**
         * Changes function's test request method
         * @param {Object} requestMethod
         */
        function onChangeRequestMethod(requestMethod) {
            lodash.set(ctrl.selectedEvent, 'spec.attributes.method', requestMethod.name);
        }

        /**
         * Changes request's source code
         * @param {string} sourceCode
         */
        function onChangeRequestSourceCode(sourceCode) {
            lodash.set(ctrl.selectedEvent, 'spec.body', sourceCode);
        }

        /**
         * Changes function's test tab
         * @param {Object} tab
         * @param {string} field
         */
        function onChangeTab(tab, field) {
            ctrl[field] = tab;
        }

        /**
         * Resets all changes
         */
        function resetData() {
            ctrl.testEventsForm.$setPristine();
            ctrl.selectedEvent = {
                metadata: {
                    namespace: lodash.get(ctrl.version, 'metadata.namespace'),
                    labels: {
                        'nuclio.io/function-name': lodash.get(ctrl.version, 'metadata.name')
                    }
                },
                spec: {
                    displayName: '',
                    triggerKind: 'http',
                    attributes: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain'
                        },
                        path: ''
                    },
                    body: ''
                }
            };
            ctrl.createEvent = true;
            ctrl.testResult = null;
            ctrl.showResponse = false;
            ctrl.requestBodyType = ctrl.requestBodyTypes[0];
            ctrl.selectedResponseTab = ctrl.responseNavigationTabs[0];
            ctrl.headers = null;
            ctrl.eventLogLevel = 'debug';

            updateRequestHeaders();
        }

        /**
         * Saves created event
         * @param {Object} event
         */
        function saveEvent(event) {
            ctrl.testEventsForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.testEventsForm.$valid) {

                var eventToSave = angular.copy(ctrl.selectedEvent);
                if (ctrl.requestBodyType === 'file') {
                    eventToSave.spec.body = '';
                }

                // set `nuclio.io/function-name` label to relate this function event to its function
                lodash.set(eventToSave, ['metadata', 'labels', 'nuclio.io/function-name'], ctrl.version.metadata.name);

                ctrl.isSplashShowed.value = true;

                // save created event on beck-end
                ctrl.createFunctionEvent({ eventData: eventToSave, isNewEvent: ctrl.createEvent }).then(function (newEvent) {
                    ctrl.getFunctionEvents({ functionData: ctrl.version }).then(function (response) {
                        ctrl.savedEvents = response;
                    });

                    if (ctrl.createEvent && angular.isDefined(newEvent)) {
                        ctrl.selectedEvent = newEvent;
                        ctrl.selectedEvent.spec.body = lodash.defaultTo(ctrl.selectedEvent.spec.body, '');
                    }

                    ctrl.createEvent = false;
                    ctrl.isSplashShowed.value = false;
                }).catch(function () {
                    DialogsService.alert($i18next.t('functions:ERROR_MSG.CREATE_UPDATE_FUNCTION_EVENT', { lng: lng }));
                    ctrl.isSplashShowed.value = false;
                });
            }
        }

        /**
         * Selects specific event from list of saved events
         * @param {Object} event
         * @param {string} [location] - location of event(ex. history)
         */
        function selectEvent(event, location) {
            if (location === 'history') {
                lodash.set(event, 'spec.displayName', '');
            }

            ctrl.selectedEvent = angular.copy(event);
            ctrl.selectedEvent.spec.body = lodash.defaultTo(ctrl.selectedEvent.spec.body, '');
            ctrl.createEvent = false;
            ctrl.showResponse = false;
            ctrl.testResult = null;
            ctrl.showLeftBar = ctrl.fixedLeftBar;
            ctrl.selectedResponseTab = ctrl.responseNavigationTabs[0];

            var contentType = ctrl.selectedEvent.spec.attributes.headers['Content-Type'];
            ctrl.requestSourceCodeLanguage = contentType === 'application/json' ? 'json' : 'textplain';
            updateRequestHeaders();

            var requestType = contentType === 'application/json' ? 'json' : contentType === 'text/plain' ? 'text' : 'file';
            ctrl.requestBodyType = lodash.find(ctrl.requestBodyTypes, ['id', requestType]);
        }

        /**
         * Invokes event
         * @param {Object} event
         */
        function testEvent(event) {
            ctrl.testEventsForm.$setPristine();
            var httpPort = lodash.get(ctrl.version, 'status.httpPort', null);

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.testing && !lodash.isNull(httpPort) && !ctrl.uploadingData.uploading && !ctrl.isDisabledTestButton()) {
                var startTime = moment();
                canceler = $q.defer();
                canceledInvocation = false;
                ctrl.testing = true;
                ctrl.testResult = {};
                ctrl.responseImage = null;

                var eventData = angular.copy(ctrl.selectedEvent);
                lodash.set(eventData, 'spec.attributes.logLevel', ctrl.eventLogLevel);

                ctrl.invokeFunction({ eventData: eventData, canceler: canceler.promise }).then(function (response) {
                    return $q.reject(response);
                }).catch(function (invocationData) {
                    if (angular.isDefined(invocationData.status) && invocationData.status !== -1) {
                        var lowerCaseHeaders = lodash.mapKeys(invocationData.headers, function (value, key) {
                            return key.toLowerCase();
                        });

                        ctrl.invokeTime = convertTime(moment().diff(startTime));

                        ctrl.testResult = {
                            status: {
                                statusCode: invocationData.status,
                                statusText: invocationData.statusText
                            },

                            // not using `lowerCaseHeaders` here so the headers will be displayed as-is
                            headers: lodash.omit(invocationData.headers, ['x-nuclio-logs', 'X-Nuclio-Logs']),
                            body: invocationData.body
                        };

                        var responseHeadersTab = lodash.find(ctrl.responseNavigationTabs, ['id', 'headers']);
                        responseHeadersTab.badge = lodash.size(ctrl.testResult.headers);

                        saveEventToHistory();

                        var logs = lodash.get(lowerCaseHeaders, 'x-nuclio-logs', null);
                        var responseLogsTab = lodash.find(ctrl.responseNavigationTabs, ['id', 'logs']);
                        ctrl.logs = lodash.isNull(logs) ? [] : angular.fromJson(logs);
                        responseLogsTab.badge = ctrl.logs.length;

                        var size = lodash.get(lowerCaseHeaders, 'content-length', null);
                        ctrl.responseSize = lodash.isNull(size) ? size : ConverterService.getConvertedBytes(Number(size), ['B', 'KB', 'MB', 'GB']);

                        var contentType = lodash.get(lowerCaseHeaders, 'content-type', null);

                        var textualFile = lodash.includes(contentType, 'text') || contentType === 'application/json';

                        // if content type is "application/json" then attempt to pretty-print JSON. The body could
                        // be either a serialized-JSON string, or an object.
                        // monaco editor must be assigned a string, not an object, then even if the content type is
                        // not "application/json" but for any reason the body is an object, attempt to pretty-print
                        // it as JSON.
                        if (contentType === 'application/json' || lodash.isObject(invocationData.body)) {
                            ctrl.testResult.body = formatJson(invocationData.body);
                        }

                        var imageFile = lodash.startsWith(contentType, 'image/');
                        if (imageFile) {
                            var reader = new FileReader();
                            reader.readAsDataURL(ctrl.testResult.body);
                            reader.onload = function () {
                                ctrl.responseImage = reader.result;
                                ctrl.testing = false;
                            };
                        } else {
                            ctrl.testing = false;
                        }

                        ctrl.responseBodyType = textualFile ? 'code' : imageFile ? 'image' : 'N/A';

                        ctrl.showResponse = true;
                    } else {
                        if (!canceledInvocation) {
                            var statusText = angular.isDefined(invocationData.error) ? invocationData.error : invocationData.status + ' ' + invocationData.statusText;
                            DialogsService.alert($i18next.t('functions:ERROR_MSG.INVOKE_FUNCTION', { lng: lng }) + statusText);
                        }

                        ctrl.testing = false;
                        ctrl.showResponse = false;
                    }

                    ctrl.isInvocationSuccess = lodash.startsWith(invocationData.status, '2');
                });
            }
        }

        /**
         * Toggles left bar
         * @param {boolean} [displayLeftBar]
         */
        function toggleLeftBar(displayLeftBar) {
            ctrl.showLeftBar = lodash.defaultTo(displayLeftBar, !ctrl.showLeftBar);
            ctrl.fixedLeftBar = false;
        }

        /**
         * Upload selected file
         * @param {Object} file - selected file
         */
        function uploadFile(file) {
            var reader = new FileReader();
            var size = ConverterService.getConvertedBytes(file.size, ['B', 'KB', 'MB', 'GB']);

            ctrl.uploadingData.size = size.value + size.label;
            ctrl.uploadingData.name = file.name;
            ctrl.uploadingData.uploading = true;

            reader.onload = function (onloadEvent) {
                if (!ctrl.uploadingData.uploaded) {
                    ctrl.uploadingData.name = file.name;
                    ctrl.uploadingData.progress = '100%';

                    if (onloadEvent.target.result === '') {
                        DialogsService.alert($i18next.t('functions:ERROR_MSG.UPLOAD_FILE.UNKNOWN', { lng: lng }));

                        deleteFile();
                    } else {
                        try {
                            ctrl.selectedEvent.spec.body = b64toBlob(onloadEvent.target.result.split(',')[1], file.type);

                            ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = file.type;
                            updateRequestHeaders();
                        } catch (ex) {
                            DialogsService.alert($i18next.t('functions:ERROR_MSG.UPLOAD_FILE.DEFAULT', { lng: lng }) + ex);

                            deleteFile();
                        }
                    }

                    $timeout(function () {
                        ctrl.uploadingData.uploading = false;
                        ctrl.uploadingData.uploaded = true;
                    }, 500);
                }
            };
            reader.onerror = function () {
                ctrl.uploadingData.uploading = false;
                ctrl.uploadingData.uploaded = false;
                ctrl.uploadingData.name = '';
            };
            reader.onprogress = function (load) {
                if (!lodash.isNil(load.target.result)) {
                    var progressPercentage = parseInt(100.0 * load.loaded / load.total);

                    ctrl.uploadingData.uploading = true;
                    ctrl.uploadingData.progress = progressPercentage + '%';
                }
            };
            reader.readAsDataURL(file);
        }

        //
        // Private methods
        //

        /**
         * Converts base64 to Blob and returns it
         * @param {string} b64Data
         * @param {string} contentType
         * @param {number} sliceSize
         * @returns {Blob}
         */
        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = lodash.defaultTo(contentType, '');
            sliceSize = lodash.defaultTo(sliceSize, 512);

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            return new Blob(byteArrays, { type: contentType });
        }

        /**
         * Converts time to milliseconds, seconds, minutes depends on value
         * @param {number} millisec
         * @returns {string}
         */
        function convertTime(millisec) {
            var seconds = (millisec / 1000).toFixed(1);
            var minutes = (millisec / (1000 * 60)).toFixed(1);

            return millisec < 1000 ? millisec + ' ms' : seconds < 60 ? seconds + ' s' : minutes + ' min';
        }

        /**
         * Formats an object as a formatted JSON.
         * @param {*} value - the object or a JSON-serialized string to format.
         * @returns {*} JSON-serialized string representation of `value` formatted with newlines and indentation.
         *      In case of an error in JSON conversion or if `value` is not a string nor an object, returns `value`
         *      as-is.
         */
        function formatJson(value) {
            try {
                if (lodash.isString(value)) {
                    value = angular.fromJson(value);
                }

                if (!lodash.isObject(value)) {
                    return returnValue();
                }

                return angular.toJson(value, 4);
            } catch (error) {
                return returnValue();
            }

            /**
             * Returns `value`.
             * @returns {*} `value` as-is.
             */
            function returnValue() {
                return value;
            }
        }

        /**
         * Handler on drag-n-dropping a file
         */
        function onDragNDropFileToBody() {
            var dropSection = $element.find('.drop-section');

            // Register event handlers for drag'n'drop of files
            dropSection.on('dragover', null, false).on('dragenter', null, function (event) {
                event.preventDefault();

                $element.find('.upload-file-section').css('padding', '3px');
                $element.find('.drop-section').css('border-color', '#239bca');
            }).on('dragleave', null, function (event) {
                event.preventDefault();

                $element.find('.upload-file-section').css('padding', '8px');
                $element.find('.drop-section').css('border-color', '#c9c9cd');
            }).on('drop', null, function (event) {
                event.preventDefault();

                if (!ctrl.uploadingData.uploading) {
                    ctrl.uploadingData = {
                        uploading: true,
                        uploaded: false,
                        progress: '0%',
                        name: ''
                    };

                    var file = lodash.get(event, 'originalEvent.dataTransfer.files[0]');

                    uploadFile(file);
                }

                $element.find('.upload-file-section').css('padding', '8px');
                $element.find('.drop-section').css('border-color', '#c9c9cd');
            });
        }

        /**
         * Saves tested event to local storage history
         */
        function saveEventToHistory() {
            var updatedHistory = lodash.defaultTo(angular.fromJson(localStorage.getItem('test-events')), []);
            if (updatedHistory.length === HISTORY_LIMIT) {
                updatedHistory.splice(0, 1);
            }
            var eventToSave = angular.copy(ctrl.selectedEvent);
            delete eventToSave.spec.displayName;
            updatedHistory.push(eventToSave);

            localStorage.setItem('test-events', angular.toJson(updatedHistory));
            updateHistory();
        }

        /**
         * Sets the invocation URL of the function
         * @param {string} ip - external IP address
         * @param {number} port - HTTP port
         */
        function setInvocationUrl(ip, port) {
            ctrl.version.ui.invocationURL = lodash.isEmpty(ip) || !lodash.isNumber(port) ? '' : 'http://' + ip + ':' + port;
        }

        /**
         * Updates headers after changing request body type or path
         */
        function updateRequestHeaders() {
            var requestHeaders = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers', {});

            ctrl.headers = lodash.map(requestHeaders, function (value, key) {
                var header = {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'label',
                        checked: true
                    }
                };
                var existedHeader = lodash.find(ctrl.headers, ['name', key]);

                if (angular.isDefined(existedHeader)) {
                    header.ui = lodash.assign(header.ui, existedHeader.ui);
                }

                return header;
            });
            ctrl.headers = lodash.compact(ctrl.headers);
        }

        /**
         * Updates request's headers
         */
        function updateHeaders() {
            var newHeaders = {};

            lodash.forEach(ctrl.headers, function (header) {
                if (header.ui.checked) {
                    newHeaders[header.name] = header.value;
                }
            });

            lodash.set(ctrl.selectedEvent, 'spec.attributes.headers', newHeaders);
        }

        /**
         * Updates invoking history
         */
        function updateHistory() {
            var nameField = 'metadata.labels[\'nuclio.io/function-name\']';
            ctrl.history = lodash.defaultTo(angular.fromJson(localStorage.getItem('test-events')), []);
            ctrl.history = lodash.filter(ctrl.history, [nameField, ctrl.version.metadata.name]);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclTestEventsLogsController.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').component('nclTestEventsLogs', {
        bindings: {
            logs: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/test-events-logs/test-events-logs.tpl.html',
        controller: NclTestEventsLogsController
    });

    function NclTestEventsLogsController(lodash) {
        var ctrl = this;
        var REQUIRED_PARAMETERS = ['level', 'name', 'time', 'err', 'message', 'ui'];

        ctrl.$onInit = onInit;

        ctrl.collapseRow = collapseRow;
        ctrl.expandAllRows = expandAllRows;
        ctrl.getLevelIconClass = getLevelIconClass;
        ctrl.getParameters = getParameters;
        ctrl.hasAdditionalParameters = hasAdditionalParameters;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.forEach(ctrl.logs, function (log) {
                lodash.set(log, 'ui.collapsed', true);
            });
        }

        //
        // Public methods
        //

        /**
         * Collapse/expand row depending on `collapse` value
         * @param {Object} log
         * @param {boolean} collapse
         */
        function collapseRow(log, collapse) {
            lodash.set(log, 'ui.collapsed', collapse);
        }

        /**
         * Collapse/expand all rows depending on `expand` value
         * @param {boolean} expand
         */
        function expandAllRows(expand) {
            lodash.forEach(ctrl.logs, function (log) {
                lodash.set(log, 'ui.collapsed', !expand);
            });
        }

        /**
         * Gets css class depending on log.level
         * @param {Object} log
         * @returns {string}
         */
        function getLevelIconClass(log) {
            return log.level === 'debug' ? 'ncl-icon-debug' : log.level === 'info' ? 'igz-icon-info-round' : log.level === 'warn' ? 'igz-icon-warning' : log.level === 'error' ? 'igz-icon-cancel-path' : '';
        }

        /**
         * Gets additional parameters
         * @param {Object} log
         * @returns {Object}
         */
        function getParameters(log) {
            return lodash.omit(log, REQUIRED_PARAMETERS);
        }

        /**
         * Checks if log has additional parameters
         * @param {Object} log
         * @returns {boolean}
         */
        function hasAdditionalParameters(log) {
            return !lodash.isEmpty(getParameters(log));
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclTestEventsNavigationTabsController.$inject = ['$i18next', 'i18next'];
    angular.module('iguazio.dashboard-controls').component('nclTestEventsNavigationTabs', {
        bindings: {
            activeTab: '<',
            tabItems: '<',
            selectedLogLevel: '<?',
            onChangeActiveTab: '&',
            onChangeLogLevel: '&?'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/test-events-navigation-tabs/test-events-navigation-tabs.tpl.html',
        controller: NclTestEventsNavigationTabsController
    });

    function NclTestEventsNavigationTabsController($i18next, i18next) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.logLevelValues = [{
            id: 'error',
            name: $i18next.t('common:ERROR', { lng: lng }),
            visible: true
        }, {
            id: 'warn',
            name: $i18next.t('common:WARNING', { lng: lng }),
            visible: true
        }, {
            id: 'info',
            name: $i18next.t('common:INFO', { lng: lng }),
            visible: true
        }, {
            id: 'debug',
            name: $i18next.t('common:DEBUG', { lng: lng }),
            visible: true
        }];

        ctrl.changeActiveTab = changeActiveTab;
        ctrl.isActiveTab = isActiveTab;

        //
        // Public methods
        //

        /**
         * Changes active nav tab
         * @param {Object} item - current status
         */
        function changeActiveTab(item) {
            ctrl.activeTab = item;

            ctrl.onChangeActiveTab({ activeTab: item });
        }

        /**
         * Checks if it is an active tab
         * @param {Object} item - current tab
         */
        function isActiveTab(item) {
            return ctrl.activeTab.id === item.id;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationAnnotationsController.$inject = ['$element', '$rootScope', '$timeout', '$i18next', 'i18next', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationAnnotations', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-annotations/version-configuration-annotations.tpl.html',
        controller: NclVersionConfigurationAnnotationsController
    });

    function NclVersionConfigurationAnnotationsController($element, $rootScope, $timeout, $i18next, i18next, lodash, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.tooltip = '<a class="link" target="_blank" ' + 'href="https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/">' + $i18next.t('functions:TOOLTIP.ANNOTATIONS.HEAD', { lng: lng }) + '</a> ' + $i18next.t('functions:TOOLTIP.ANNOTATIONS.REST', { lng: lng });

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var annotations = lodash.get(ctrl.version, 'metadata.annotations', []);

            ctrl.annotations = lodash.map(annotations, function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'annotation'
                    }
                };
            });

            $timeout(function () {
                if (ctrl.annotationsForm.$invalid) {
                    ctrl.annotationsForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'annotation', isDisabled: true });
                }
            });
        }

        /**
         * Linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public methods
        //

        /**
         * Adds new annotation
         */
        function addNewAnnotation(event) {
            $timeout(function () {
                if (ctrl.annotations.length < 1 || lodash.last(ctrl.annotations).ui.isFormValid) {
                    ctrl.annotations.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'annotation'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'annotation',
                        isDisabled: true
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of label in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.annotations.splice(index, 1);

                updateAnnotations();
            }
        }

        /**
         * Changes annotations data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.annotations[index] = label;

            updateAnnotations();
        }

        //
        // Private methods
        //

        /**
         * Updates function`s annotations
         */
        function updateAnnotations() {
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (annotation) {
                if (!annotation.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: annotation.ui.name,
                        isDisabled: true
                    });
                }
                newAnnotations[annotation.name] = annotation.value;
            });
            lodash.set(ctrl.version, 'metadata.annotations', newAnnotations);
            ctrl.onChangeCallback();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationBasicSettingsController.$inject = ['$rootScope', '$timeout', '$i18next', 'i18next', 'lodash', 'ConfigService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationBasicSettings', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-basic-settings/version-configuration-basic-settings.tpl.html',
        controller: NclVersionConfigurationBasicSettingsController
    });

    function NclVersionConfigurationBasicSettingsController($rootScope, $timeout, $i18next, i18next, lodash, ConfigService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.enableFunction = false;
        ctrl.enableTimeout = false;
        ctrl.timeout = {
            min: 0,
            sec: 0
        };
        ctrl.logLevelValues = [{
            id: 'error',
            name: $i18next.t('common:ERROR', { lng: lng })
        }, {
            id: 'warn',
            name: $i18next.t('common:WARNING', { lng: lng })
        }, {
            id: 'info',
            name: $i18next.t('common:INFO', { lng: lng })
        }, {
            id: 'debug',
            name: $i18next.t('common:DEBUG', { lng: lng })
        }];

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.setPriority = setPriority;
        ctrl.updateEnableStatus = updateEnableStatus;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (ctrl.isDemoMode()) {
                var timeoutSeconds = lodash.get(ctrl.version, 'spec.timeoutSeconds');

                if (lodash.isNumber(timeoutSeconds)) {
                    ctrl.timeout.min = Math.floor(timeoutSeconds / 60);
                    ctrl.timeout.sec = Math.floor(timeoutSeconds % 60);
                }
            }

            lodash.defaultsDeep(ctrl.version, {
                spec: {
                    loggerSinks: [{ level: 'debug' }]
                }
            });

            ctrl.enableFunction = !lodash.get(ctrl.version, 'spec.disable', false);
        }

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl, field, lodash.includes(field, 'timeout') ? Number(newData) : newData);

            $timeout(function () {
                if (ctrl.basicSettingsForm.$valid) {
                    if (lodash.includes(field, 'timeout')) {
                        lodash.set(ctrl.version, 'spec.timeoutSeconds', ctrl.timeout.min * 60 + ctrl.timeout.sec);
                    } else {
                        lodash.set(ctrl.version, field, newData);
                    }

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'settings', isDisabled: false });

                    ctrl.onChangeCallback();
                } else {
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'settings', isDisabled: true });
                }
            });
        }

        /**
         * Sets logger level
         * @param {Object} item
         */
        function setPriority(item) {
            lodash.set(ctrl.version, 'spec.loggerSinks[0].level', item.id);

            ctrl.onChangeCallback();
        }

        /**
         * Switches enable/disable function status
         */
        function updateEnableStatus() {
            lodash.set(ctrl.version, 'spec.disable', !ctrl.enableFunction);

            ctrl.onChangeCallback();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationBuildController.$inject = ['$rootScope', '$scope', '$timeout', '$i18next', 'i18next', 'lodash', 'ngDialog', 'Upload', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationBuild', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build.tpl.html',
        controller: NclVersionConfigurationBuildController
    });

    function NclVersionConfigurationBuildController($rootScope, $scope, $timeout, $i18next, i18next, lodash, ngDialog, Upload, ConfigService) {
        var ctrl = this;
        var lng = i18next.language;
        var uploadType = '';

        ctrl.actions = initActions();
        ctrl.build = {
            runtimeAttributes: {}
        };
        ctrl.script = {
            uploading: false,
            uploaded: false,
            progress: '0%',
            icon: 'ncl-icon-script',
            name: ''
        };
        ctrl.file = {
            uploading: false,
            uploaded: false,
            progress: '0%',
            icon: 'ncl-icon-file',
            name: ''
        };
        ctrl.disabled = true;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.deleteFile = deleteFile;
        ctrl.getFileConfig = getFileConfig;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.onFireAction = onFireAction;
        ctrl.uploadFile = uploadFile;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.disabled = lodash.get(ctrl.version, 'spec.build.codeEntryType') !== 'sourceCode';
            ctrl.build.commands = lodash.get(ctrl.version, 'spec.build.commands', []);
            ctrl.build.commands = ctrl.build.commands.join('\n').replace(/''/g, '\'');

            ctrl.build.dependencies = lodash.get(ctrl.version, 'spec.build.dependencies', []).join('\n');
            ctrl.build.runtimeAttributes.repositories = lodash.get(ctrl.version, 'spec.build.runtimeAttributes.repositories', []).join('\n');

            $timeout(function () {
                if (ctrl.buildForm.$invalid) {
                    ctrl.buildForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'build', isDisabled: true });
                }
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'build',
                isDisabled: lodash.get(ctrl.buildForm, '$invalid', false)
            });
        }

        //
        // Public methods
        //

        /**
         * Update spec.buildCommands value
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (lodash.includes(['commands', 'dependencies', 'runtimeAttributes.repositories'], field)) {
                if (lodash.isEmpty(newData)) {
                    lodash.unset(ctrl.build, field);
                    lodash.unset(ctrl.version, 'spec.build.' + field);
                } else {
                    var commands = newData.replace(/\r/g, '\n').split(/\n+/);

                    lodash.set(ctrl.build, field, newData);
                    lodash.set(ctrl.version, 'spec.build.' + field, commands);
                }
            } else {
                lodash.set(ctrl.version, field, newData);
            }

            $timeout(function () {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'build',
                    isDisabled: lodash.get(ctrl.buildForm, '$invalid', false)
                });
            });

            ctrl.onChangeCallback();
        }

        /**
         * Returns uploading file config object
         * @returns {Object}
         */
        function getFileConfig() {
            return ctrl[uploadType];
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} fileType - a type of uploading file
         * @returns {boolean} if file of this fileType already uploaded
         */
        function onFireAction(fileType) {

            // this if is a temporary solution as at the moment we don't know the maximum quantity of the uploading files
            if (fileType === 'file' && ctrl.file.uploaded || fileType === 'script' && ctrl.script.uploaded) {
                return false;
            }

            uploadType = fileType;

            ngDialog.open({
                template: '<ncl-version-configuration-build-dialog data-close-dialog="closeThisDialog(file)"></ncl-version-configuration-build-dialog>',
                plain: true,
                scope: $scope,
                className: 'ngdialog-theme-nuclio version-configuration-build-dialog-wrapper'
            }).closePromise.then(function (data) {
                if (!lodash.isNil(data.value)) {
                    ctrl.uploadFile(data.value);
                }
            });
        }

        /**
         * Upload selected file on server
         * @param {Object} file - selected file
         */
        function uploadFile(file) {
            var uploadingData = getFileConfig();

            Upload.upload({
                url: '', // TODO
                data: { file: file }
            }).then(function (response) {
                // on success
                if (!uploadingData.uploaded && !lodash.isNil(response.config.data.file)) {
                    uploadingData.uploading = false;
                    uploadingData.uploaded = true;
                    uploadingData.name = response.config.data.file.name;
                    uploadingData.progress = '100%';
                }
            }, function (response) {
                // on error
                uploadingData.uploading = false;
                uploadingData.uploaded = false;
            }, function (load) {
                // on progress
                if (!lodash.isNil(load.config.data.file)) {
                    var progressPercentage = parseInt(100.0 * load.loaded / load.total);

                    uploadingData.uploading = true;
                    uploadingData.progress = progressPercentage + '%';
                    uploadingData.name = load.config.data.file.name;
                }
            });

            uploadingData.uploading = false;
        }

        /**
         * Delete file button handler
         * @param {string} type - type of file
         */
        function deleteFile(type) {
            ctrl[type] = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                icon: 'ncl-icon-' + type,
                name: ''
            };
            ctrl.onChangeCallback();
        }

        //
        // Private methods
        //

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [{
                id: 'script',
                label: $i18next.t('functions:SCRIPT', { lng: lng }),
                icon: 'ncl-icon-script',
                active: true
            }, {
                id: 'file',
                label: $i18next.t('common:FILE', { lng: lng }),
                icon: 'ncl-icon-file',
                active: true
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationEnvironmentVariablesController.$inject = ['$element', '$rootScope', '$scope', '$timeout', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationEnvironmentVariables', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
        controller: NclVersionConfigurationEnvironmentVariablesController
    });

    function NclVersionConfigurationEnvironmentVariablesController($element, $rootScope, $scope, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewVariable = addNewVariable;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.variables = lodash.chain(ctrl.version).get('spec.env', []).map(function (variable) {
                variable.ui = {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'variable'
                };

                return variable;
            }).value();

            ctrl.isOnlyValueTypeInputs = !lodash.some(ctrl.variables, 'valueFrom');

            $scope.$on('key-value-type-changed', function (event, isValueType) {
                if (!isValueType) {
                    ctrl.isOnlyValueTypeInputs = false;
                }
            });

            $timeout(function () {
                if (ctrl.environmentVariablesForm.$invalid) {
                    ctrl.environmentVariablesForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'variable', isDisabled: true });
                }
            });
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public methods
        //

        /**
         * Adds new variable
         */
        function addNewVariable(event) {
            $timeout(function () {
                if (ctrl.variables.length < 1 || lodash.chain(ctrl.variables).last().get('ui.isFormValid', true).value()) {
                    ctrl.variables.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'variable'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'variable', isDisabled: true });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.variables.splice(index, 1);

                updateVariables();
            }
        }

        /**
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeData(variable, index) {
            ctrl.variables[index] = variable;

            updateVariables();
        }

        /**
         * Updates function`s variables
         */
        function updateVariables() {
            var variables = lodash.map(ctrl.variables, function (variable) {
                if (!variable.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: variable.ui.name, isDisabled: true });
                }
                return lodash.omit(variable, 'ui');
            });

            lodash.set(ctrl.version, 'spec.env', variables);
            ctrl.onChangeCallback();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationLabelsController.$inject = ['$element', '$rootScope', '$timeout', '$i18next', 'i18next', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationLabels', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
        controller: NclVersionConfigurationLabelsController
    });

    function NclVersionConfigurationLabelsController($element, $rootScope, $timeout, $i18next, i18next, lodash, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.tooltip = '<a class="link" target="_blank" ' + 'href="https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/">' + $i18next.t('functions:TOOLTIP.LABELS.HEAD', { lng: lng }) + '</a> ' + $i18next.t('functions:TOOLTIP.LABELS.REST', { lng: lng });

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewLabel = addNewLabel;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var labels = lodash.get(ctrl.version, 'metadata.labels', []);

            ctrl.labels = lodash.chain(labels).omitBy(function (value, key) {
                return lodash.startsWith(key, 'nuclio.io/');
            }).map(function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'label'
                    }
                };
            }).value();
            ctrl.labels = lodash.compact(ctrl.labels);

            $timeout(function () {
                if (ctrl.labelsForm.$invalid) {
                    ctrl.labelsForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'label', isDisabled: true });
                }
            });
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public methods
        //

        /**
         * Adds new label
         */
        function addNewLabel(event) {
            $timeout(function () {
                if (ctrl.labels.length < 1 || lodash.last(ctrl.labels).ui.isFormValid) {
                    ctrl.labels.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'label'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'label', isDisabled: true });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of label in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.labels.splice(index, 1);

                updateLabels();
            }
        }

        /**
         * Changes labels data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.labels[index] = label;

            updateLabels();
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateLabels() {
            var labels = lodash.get(ctrl.version, 'metadata.labels', []);

            var nuclioLabels = lodash.pickBy(labels, function (value, key) {
                return lodash.includes(key, 'nuclio.io/');
            });

            var newLabels = {};
            lodash.forEach(ctrl.labels, function (label) {
                if (!label.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: label.ui.name, isDisabled: true });
                }
                newLabels[label.name] = label.value;
            });
            newLabels = lodash.merge(newLabels, nuclioLabels);

            lodash.set(ctrl.version, 'metadata.labels', newLabels);
            ctrl.onChangeCallback();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationLoggingController.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationLogging', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-logging/version-configuration-logging.tpl.html',
        controller: NclVersionConfigurationLoggingController
    });

    function NclVersionConfigurationLoggingController(lodash) {
        var ctrl = this;

        ctrl.inputValueCallback = inputValueCallback;

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);

            ctrl.onChangeCallback();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationResourcesController.$inject = ['$timeout', '$rootScope', '$scope', '$i18next', 'i18next', 'lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationResources', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-resources/version-configuration-resources.tpl.html',
        controller: NclVersionConfigurationResourcesController
    });

    function NclVersionConfigurationResourcesController($timeout, $rootScope, $scope, $i18next, i18next, lodash, ConfigService) {
        var ctrl = this;
        var lng = i18next.language;

        var defaultUnit = {
            id: 'gb',
            name: 'GB',
            unit: 'G',
            root: 1000,
            power: 3
        };

        ctrl.cpuDropdownOptions = [{
            id: 'millicores',
            name: 'millicpu',
            unit: 'm',
            precision: '0',
            step: '100',
            minValue: 1,
            placeholder: $i18next.t('common:FOR_EXAMPLE', { lng: lng }) + ': 1500',
            onChange: function onChange(value) {
                return parseFloat(value) * 1000;
            },
            convertValue: function convertValue(value) {
                return parseInt(value);
            }
        }, {
            id: 'cpu',
            name: 'cpu',
            unit: '',
            precision: '3',
            step: '0.1',
            minValue: 0.1,
            placeholder: $i18next.t('common:FOR_EXAMPLE', { lng: lng }) + ': 1.5',
            onChange: function onChange(value) {
                return parseInt(value) / 1000;
            },
            convertValue: function convertValue(value) {
                return parseFloat(value) * 1000;
            }
        }];

        ctrl.dropdownOptions = [{ id: 'bytes', name: 'Bytes', unit: '', root: 0, power: 0 }, { id: 'kb', name: 'KB', unit: 'k', root: 1000, power: 1 }, { id: 'kib', name: 'KiB', unit: 'Ki', root: 1024, power: 1 }, { id: 'mb', name: 'MB', unit: 'M', root: 1000, power: 2 }, { id: 'mib', name: 'MiB', unit: 'Mi', root: 1024, power: 2 }, { id: 'gb', name: 'GB', unit: 'G', root: 1000, power: 3 }, { id: 'gib', name: 'GiB', unit: 'Gi', root: 1024, power: 3 }, { id: 'tb', name: 'TB', unit: 'T', root: 1000, power: 4 }, { id: 'tib', name: 'TiB', unit: 'Ti', root: 1024, power: 4 }, { id: 'pb', name: 'PB', unit: 'P', root: 1000, power: 5 }, { id: 'pib', name: 'PiB', unit: 'Pi', root: 1024, power: 5 }, { id: 'eb', name: 'EB', unit: 'E', root: 1000, power: 6 }, { id: 'eib', name: 'EiB', unit: 'Ei', root: 1024, power: 6 }];

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.numberInputCallback = numberInputCallback;
        ctrl.sliderInputCallback = sliderInputCallback;
        ctrl.toggleTargetCpu = toggleTargetCpu;

        ctrl.cpuDropdownCallback = cpuDropdownCallback;
        ctrl.memoryInputCallback = memoryInputCallback;
        ctrl.memoryDropdownCallback = memoryDropdownCallback;
        ctrl.inputGpuValueCallback = inputGpuValueCallback;
        ctrl.inputValueCallback = inputValueCallback;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            initParametersData();
            initSlider();

            ctrl.minReplicas = lodash.get(ctrl.version, 'spec.minReplicas');
            ctrl.maxReplicas = lodash.get(ctrl.version, 'spec.maxReplicas');

            $scope.$watch('$ctrl.resourcesForm.$invalid', function (value) {
                $rootScope.$broadcast('change-state-deploy-button', { component: 'resources', isDisabled: value });
            });

            $timeout(function () {
                setFormValidity();
            });
        }

        /**
         * On destroy method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', { component: 'resources', isDisabled: false });
        }

        //
        // Public methods
        //

        /**
         * CPU dropdown callback
         * @param {Object} item
         * @param {boolean} isItemChanged
         * @param {string} field
         */
        function cpuDropdownCallback(item, isItemChanged, field) {
            if (!lodash.isEqual(item, ctrl[field])) {
                if (isRequestsInput(field)) {
                    if (ctrl.requestsCpuValue) {
                        ctrl.requestsCpuValue = item.onChange(ctrl.requestsCpuValue);
                        lodash.set(ctrl.version, 'spec.resources.requests.cpu', ctrl.requestsCpuValue + item.unit);
                    }
                } else if (ctrl.limitsCpuValue) {
                    ctrl.limitsCpuValue = item.onChange(ctrl.limitsCpuValue);
                    lodash.set(ctrl.version, 'spec.resources.limits.cpu', ctrl.limitsCpuValue + item.unit);
                }

                lodash.set(ctrl, field, item);

                checkIfCpuInputsValid();
            }
        }

        /**
         * Number input callback for GPU fields
         * @param {number} newData
         * @param {string} field
         */
        function inputGpuValueCallback(newData, field) {
            if (angular.isNumber(newData)) {
                ctrl.limitsGpuValue = newData;

                lodash.set(ctrl.version, ['spec', 'resources', field, 'nvidia.com/gpu'], String(newData));
                ctrl.onChangeCallback();
            } else {
                lodash.unset(ctrl.version, ['spec', 'resources', field, 'nvidia.com/gpu']);
                ctrl.limitsGpuValue = null;
            }
        }

        /**
         * Number input callback
         * @param {number} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (angular.isNumber(newData)) {
                if (isRequestsInput(field)) {
                    ctrl.requestsCpuValue = newData;
                    newData = newData + ctrl.selectedCpuRequestItem.unit;
                } else {
                    ctrl.limitsCpuValue = newData;
                    newData = newData + ctrl.selectedCpuLimitItem.unit;
                }

                lodash.set(ctrl.version, 'spec.' + field, newData);
                ctrl.onChangeCallback();
            } else {
                lodash.unset(ctrl.version, 'spec.' + field);
                ctrl[isRequestsInput(field) ? 'requestsCpuValue' : 'limitsCpuValue'] = null;
            }

            checkIfCpuInputsValid();
        }

        /**
         * Memory number input callback
         * @param {number} newData
         * @param {string} field
         */
        function memoryInputCallback(newData, field) {
            var newValue, sizeUnit;

            sizeUnit = isRequestsInput(field) ? lodash.get(ctrl.selectedRequestUnit, 'unit', 'G') : lodash.get(ctrl.selectedLimitUnit, 'unit', 'G');

            if (!angular.isNumber(newData)) {
                lodash.unset(ctrl.version, field);

                // if new value isn't number that both fields will be valid, because one of them is empty
                ctrl.resourcesForm.requestMemory.$setValidity('equality', true);
                ctrl.resourcesForm.limitsMemory.$setValidity('equality', true);
            } else {
                newValue = newData + sizeUnit;
                lodash.set(ctrl.version, field, newValue);

                checkIfMemoryInputsValid(newValue, field);
            }

            ctrl.onChangeCallback();
        }

        /**
         * Memory dropdown callback
         * @param {Object} item
         * @param {boolean} isItemChanged
         * @param {string} field
         */
        function memoryDropdownCallback(item, isItemChanged, field) {
            var sizeValue = lodash.parseInt(lodash.get(ctrl.version, field, ' 0G'));
            var newValue;

            if (lodash.includes(field, 'requests')) {
                ctrl.selectedRequestUnit = item;
            } else if (lodash.includes(field, 'limits')) {
                ctrl.selectedLimitUnit = item;
            }

            if (!angular.isNumber(sizeValue) || lodash.isNaN(sizeValue)) {
                lodash.unset(ctrl.version, field);
            } else {
                newValue = sizeValue + item.unit;
                lodash.set(ctrl.version, field, newValue);

                checkIfMemoryInputsValid(newValue, field);
            }

            ctrl.onChangeCallback();
        }

        /**
         * Update data callback
         * @param {string|number} newData
         * @param {string} field
         */
        function numberInputCallback(newData, field) {
            if (lodash.isNil(newData) || newData === '') {
                lodash.unset(ctrl.version.spec, field);
            } else {
                lodash.set(ctrl.version.spec, field, newData);
            }

            lodash.set(ctrl, field, newData);

            ctrl.onChangeCallback();
        }

        /**
         * Update limits callback
         * @param {number} newValue
         * @param {string} field
         */
        function sliderInputCallback(newValue, field) {
            if (lodash.isNil(newValue)) {
                lodash.unset(ctrl.version, field);
            } else {
                lodash.set(ctrl.version, field, Number(newValue));
            }

            ctrl.onChangeCallback();
        }

        /**
         * Sets slider value & unit and updates the corresponding model according to its enabled/disabled state.
         */
        function toggleTargetCpu() {
            if (ctrl.targetCpuSliderConfig.options.disabled) {
                lodash.unset(ctrl.version, 'spec.targetCPU');
                ctrl.targetCpuValueUnit = '';
                ctrl.targetCpuSliderConfig.valueLabel = 'disabled';
            } else {
                lodash.set(ctrl.version, 'spec.targetCPU', ctrl.targetCpuSliderConfig.value);
                ctrl.targetCpuSliderConfig.valueLabel = String(ctrl.targetCpuSliderConfig.value);
                ctrl.targetCpuValueUnit = '%';
            }
        }

        //
        // Private methods
        //

        /**
         * Checks if cpu number inputs and drop-downs valid
         * Example:
         * Request: "400m" - Limit: "0.6" are valid
         * Request: "300m" - Limit: "0.2" are invalid
         */
        function checkIfCpuInputsValid() {
            var requestsCpu = lodash.get(ctrl.version, 'spec.resources.requests.cpu');
            var limitsCpu = lodash.get(ctrl.version, 'spec.resources.limits.cpu');
            var isFieldsValid;

            if (lodash.isNil(requestsCpu) || lodash.isNil(limitsCpu)) {
                isFieldsValid = true;
            } else {
                isFieldsValid = ctrl.selectedCpuRequestItem.convertValue(requestsCpu) <= ctrl.selectedCpuLimitItem.convertValue(limitsCpu);
            }

            ctrl.resourcesForm.requestCpu.$setValidity('equality', isFieldsValid);
            ctrl.resourcesForm.limitsCpu.$setValidity('equality', isFieldsValid);
        }

        /**
         * Checks if memory number inputs and drop-downs valid
         * Example:
         * Request: "4GB" - Limit: "6GB" are valid
         * Request: "4TB" - Limit: "6GB" are invalid
         * @param {string} value
         * @param {string} field
         */
        function checkIfMemoryInputsValid(value, field) {

            // oppositeValue is a variable for opposite field of current value
            // if value argument is a value of 'Request' field that 'oppositeValue' will contain value of 'Limit' field
            var oppositeValue;
            var isFieldsValid;

            if (lodash.includes(field, 'requests')) {
                oppositeValue = lodash.get(ctrl.version, 'spec.resources.limits.memory');

                // compare 'Request' and 'Limit' fields values converted in bytes
                isFieldsValid = lodash.isNil(oppositeValue) ? true : convertToBytes(value) <= convertToBytes(oppositeValue);
            } else if (lodash.includes(field, 'limits')) {
                oppositeValue = lodash.get(ctrl.version, 'spec.resources.requests.memory');

                // compare 'Request' and 'Limit' fields values converted in bytes
                isFieldsValid = lodash.isNil(oppositeValue) ? true : convertToBytes(value) >= convertToBytes(oppositeValue);
            }

            ctrl.resourcesForm.requestMemory.$setValidity('equality', isFieldsValid);
            ctrl.resourcesForm.limitsMemory.$setValidity('equality', isFieldsValid);
        }

        /**
         * Converts megabytes, gigabytes and terabytes into bytes
         * @param {string} value
         * @returns {number}
         */
        function convertToBytes(value) {
            var unit = extractUnit(value);
            var unitData = lodash.find(ctrl.dropdownOptions, ['unit', unit]);

            return parseInt(value) * Math.pow(unitData.root, unitData.power);
        }

        /**
         * Extracts the unit part of a string consisting of a numerical value then a unit.
         * @param {string} str - the string with value and unit.
         * @returns {string} the unit, or the empty-string if unit does not exist in the `str`.
         * @example
         * extractUnit('100 GB');
         * // => 'GB'
         *
         * extractUnit('100GB');
         * // => 'GB'
         *
         * extractUnit('100');
         * // => ''
         */
        function extractUnit(str) {
            return lodash.get(str.match(/[a-zA-Z]+/), '[0]', '');
        }

        /**
         * Init default common parameters for new version
         */
        function initParametersData() {
            var requestsMemory = lodash.get(ctrl.version, 'spec.resources.requests.memory');
            var limitsMemory = lodash.get(ctrl.version, 'spec.resources.limits.memory');
            var requestsCpu = lodash.get(ctrl.version, 'spec.resources.requests.cpu');
            var limitsCpu = lodash.get(ctrl.version, 'spec.resources.limits.cpu');
            var limitsGpu = lodash.get(ctrl.version, ['spec', 'resources', 'limits', 'nvidia.com/gpu']);

            ctrl.requestsMemoryValue = parseValue(requestsMemory);
            ctrl.limitsMemoryValue = parseValue(limitsMemory);
            ctrl.requestsCpuValue = parseValue(requestsCpu);
            ctrl.limitsCpuValue = parseValue(limitsCpu);
            ctrl.limitsGpuValue = parseValue(limitsGpu);

            // get size unit from memory values into int or set default, example: '15G' -> 'G'
            ctrl.selectedRequestUnit = lodash.isNil(requestsMemory) ? defaultUnit : lodash.find(ctrl.dropdownOptions, ['unit', extractUnit(requestsMemory)]);
            ctrl.selectedLimitUnit = lodash.isNil(limitsMemory) ? defaultUnit : lodash.find(ctrl.dropdownOptions, ['unit', extractUnit(limitsMemory)]);

            ctrl.selectedCpuRequestItem = lodash.isNil(requestsCpu) ? ctrl.cpuDropdownOptions[0] : lodash.find(ctrl.cpuDropdownOptions, ['unit', extractUnit(requestsCpu)]);
            ctrl.selectedCpuLimitItem = lodash.isNil(limitsCpu) ? ctrl.cpuDropdownOptions[0] : lodash.find(ctrl.cpuDropdownOptions, ['unit', extractUnit(limitsCpu)]);

            function parseValue(value) {
                if (lodash.isNil(value)) {
                    return null;
                }
                var parsedValue = parseFloat(value);

                return parsedValue > 0 ? parsedValue : null;
            }
        }

        /**
         * Inits data for sliders
         */
        function initSlider() {
            var targetCpuValue = lodash.get(ctrl.version, 'spec.targetCPU');

            ctrl.targetCpuValueUnit = '%';
            ctrl.targetCpuSliderConfig = {
                value: lodash.defaultTo(targetCpuValue, 75),
                valueLabel: lodash.defaultTo(targetCpuValue, '75'),
                pow: 0,
                unitLabel: '%',
                labelHelpIcon: false,
                options: {
                    disabled: lodash.isNil(targetCpuValue),
                    floor: 1,
                    id: 'targetCPU',
                    ceil: 100,
                    step: 1,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };

            toggleTargetCpu();
        }

        /**
         * Checks if input is related to `CPU Request`
         * @param {string} field
         */
        function isRequestsInput(field) {
            return lodash.includes(field.toLowerCase(), 'request');
        }

        /**
         * Show form errors if form is invalid
         */
        function setFormValidity() {
            lodash.forEach(['requestMemory', 'limitsMemory', 'requestCpu', 'limitsCpu', 'limitsGpu', 'minReplicas', 'maxReplicas'], prepareToValidity);

            var path = 'spec.resources.requests.memory';
            checkIfMemoryInputsValid(lodash.get(ctrl.version, path, '0'), path);

            /**
             * Set `dirty` to true and `ctrl.numberInputChanged` of `number-input.component` to true
             * for remove `pristine` css class
             */
            function prepareToValidity(field) {
                if (angular.isDefined(ctrl.resourcesForm[field])) {
                    ctrl.resourcesForm[field].$dirty = true;
                    ctrl.resourcesForm[field].$$element.scope().$ctrl.numberInputChanged = true;
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationRuntimeAttributesController.$inject = ['$element', '$rootScope', '$timeout', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationRuntimeAttributes', {
        bindings: {
            version: '<',
            onChangeCallback: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
        controller: NclVersionConfigurationRuntimeAttributesController
    });

    function NclVersionConfigurationRuntimeAttributesController($element, $rootScope, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.addNewAttribute = addNewAttribute;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        ctrl.runtimeAttributes = {};

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {

            // Set attributes from ctrl.version to local ctrl.runtimeAttributes.
            // The attributes stored in arrays are converted to a string by using `join('\n')` method
            lodash.assign(ctrl.runtimeAttributes, {
                jvmOptions: lodash.get(ctrl.version, 'spec.runtimeAttributes.jvmOptions', []).join('\n'),
                arguments: lodash.get(ctrl.version, 'spec.runtimeAttributes.arguments', '')
            });

            // Set attributes stored in key-value inputs
            var attributes = lodash.get(ctrl.version, 'spec.runtimeAttributes.responseHeaders', []);
            ctrl.attributes = lodash.chain(attributes).map(function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'attribute'
                    }
                };
            }).value();
            ctrl.attributes = lodash.compact(ctrl.attributes);
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public method
        //

        /**
         * Update spec.runtimeAttributes value
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (field === 'jvmOptions') {
                ctrl.runtimeAttributes.jvmOptions = newData;
                lodash.set(ctrl.version, 'spec.runtimeAttributes.jvmOptions', newData.replace(/\r/g, '\n').split(/\n+/));
            } else {
                lodash.set(ctrl.version, 'spec.runtimeAttributes.' + field, newData);
            }

            ctrl.onChangeCallback();
        }

        /**
         * Adds new Attribute
         */
        function addNewAttribute(event) {
            $timeout(function () {
                if (ctrl.attributes.length < 1 || lodash.last(ctrl.attributes).ui.isFormValid) {
                    ctrl.attributes.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'attribute'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'attribute', isDisabled: true });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of label in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.attributes.splice(index, 1);

                updateAttributes();
            }
        }

        /**
         * Changes labels data
         * @param {Object} attribute
         * @param {number} index
         */
        function onChangeData(attribute, index) {
            ctrl.attributes[index] = attribute;

            updateAttributes();
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateAttributes() {
            var newAttributes = {};

            lodash.forEach(ctrl.attributes, function (attribute) {
                if (!attribute.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: attribute.ui.name, isDisabled: true });
                }
                newAttributes[attribute.name] = attribute.value;
            });

            lodash.set(ctrl.version, 'spec.runtimeAttributes.responseHeaders', newAttributes);

            ctrl.onChangeCallback();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationVolumesController.$inject = ['$rootScope', '$timeout', '$i18next', 'i18next', 'lodash', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationVolumes', {
        bindings: {
            version: '<',
            onChangeCallback: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-volumes/version-configuration-volumes.tpl.html',
        controller: NclVersionConfigurationVolumesController
    });

    function NclVersionConfigurationVolumesController($rootScope, $timeout, $i18next, i18next, lodash, DialogsService) {
        var ctrl = this;
        var lng = i18next.languages;

        ctrl.isCreateModeActive = false;
        ctrl.volumes = [];
        ctrl.igzScrollConfig = {
            maxElementsCount: 5,
            childrenSelector: '.ncl-collapsing-row'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.createVolume = createVolume;
        ctrl.editVolumeCallback = editVolumeCallback;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // get volumes list
            ctrl.volumes = lodash.map(lodash.get(ctrl.version, 'spec.volumes', []), function (value) {
                var volumeItem = angular.copy(value);

                volumeItem.ui = {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'volume'
                };

                return volumeItem;
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', { component: 'volume', isDisabled: false });
        }

        //
        // Public methods
        //

        /**
         * Toggle create binding mode
         * @param {Event} event
         */
        function createVolume(event) {
            $timeout(function () {
                if (!isVolumeInEditMode()) {
                    ctrl.volumes.push({
                        volumeMount: {
                            name: ''
                        },
                        volume: {
                            name: ''
                        },
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'volume'
                        }
                    });

                    event.stopPropagation();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'volume', isDisabled: true });
                }
            }, 100);
        }

        /**
         * Edit item callback function
         * @param {Object} item - selected item
         */
        function editVolumeCallback(item) {
            ctrl.handleAction('update', item);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - e.g. `'delete'`, `'edit'`, `'update'`
         * @param {Object} selectedItem - an object of selected volume
         */
        function handleAction(actionType, selectedItem) {
            if (actionType === 'delete') {
                deleteHandler(selectedItem);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTIONALITY_IS_NOT_IMPLEMENTED', { lng: lng }));
            }

            $rootScope.$broadcast('change-state-deploy-button', { component: 'volume', isDisabled: false });
            lodash.forEach(ctrl.volumes, function (volume) {
                if (!volume.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: volume.ui.name, isDisabled: true });
                }
            });

            ctrl.onChangeCallback();
        }

        //
        // Private methods
        //

        /**
         * Deletes selected item
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.volumes, ['volume.name', selectedItem.volume.name]);

            var workingCopy = lodash.map(ctrl.volumes, function (volume) {
                return lodash.omit(volume, 'ui');
            });

            lodash.set(ctrl.version, 'spec.volumes', workingCopy);
        }

        /**
         * Toggles item to edit mode
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function editHandler(selectedItem) {
            var volume = lodash.find(ctrl.volumes, ['volume.name', selectedItem.volume.name]);
            volume.ui.editModeActive = true;
        }

        /**
         * Updates data in selected item
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function updateHandler(selectedItem) {
            var workingCopy = angular.copy(ctrl.volumes);
            var currentVolume = lodash.find(ctrl.volumes, ['volume.name', selectedItem.volume.name]);
            var indexOfEditableElement = lodash.findIndex(ctrl.volumes, ['volume.name', selectedItem.volume.name]);

            if (angular.isDefined(currentVolume)) {
                workingCopy[indexOfEditableElement] = {
                    volumeMount: selectedItem.volumeMount,
                    volume: selectedItem.volume
                };

                lodash.forEach(workingCopy, function (volume) {
                    delete volume.ui;
                });

                lodash.set(ctrl.version, 'spec.volumes', workingCopy);
            }
        }

        /**
         * Check if trigger is in edit mode
         * @returns {boolean}
         */
        function isVolumeInEditMode() {
            var isEditMode = false;

            ctrl.volumes.forEach(function (volume) {
                if (volume.ui.editModeActive) {
                    isEditMode = true;
                }
            });

            return isEditMode;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationBuildDialogController.$inject = ['EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationBuildDialog', {
        bindings: {
            closeDialog: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build-dialog/version-configuration-build-dialog.tpl.html',
        controller: NclVersionConfigurationBuildDialogController
    });

    function NclVersionConfigurationBuildDialogController(EventHelperService) {
        var ctrl = this;

        ctrl.onClose = onClose;
        ctrl.uploadFile = uploadFile;

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog();
            }
        }

        /**
         * Closes dialog and pass selected file for further work
         * @param {Object} file - uploading file
         */
        function uploadFile(file) {
            ctrl.closeDialog({ file: file });
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    NclProjectsController.$inject = ['$element', '$filter', '$rootScope', '$scope', '$state', '$q', '$i18next', 'i18next', 'lodash', 'ngDialog', 'ActionCheckboxAllService', 'CommonTableService', 'ConfigService', 'DialogsService', 'ExportService', 'ImportService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclProjects', {
        bindings: {
            projects: '<',
            createProject: '&',
            deleteProject: '&',
            updateProject: '&',
            getProjects: '&',
            getFunctions: '&'
        },
        templateUrl: 'nuclio/projects/projects.tpl.html',
        controller: NclProjectsController
    });

    function NclProjectsController($element, $filter, $rootScope, $scope, $state, $q, $i18next, i18next, lodash, ngDialog, ActionCheckboxAllService, CommonTableService, ConfigService, DialogsService, ExportService, ImportService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [];
        ctrl.dropdownActions = [{
            id: 'exportProjects',
            name: $i18next.t('functions:EXPORT_ALL_PROJECTS', { lng: lng })
        }, {
            id: 'importProject',
            name: $i18next.t('functions:IMPORT_PROJECTS', { lng: lng })
        }];
        ctrl.checkedItemsCount = 0;
        ctrl.filtersCounter = 0;
        ctrl.isFiltersShowed = {
            value: false,
            changeValue: function changeValue(newVal) {
                this.value = newVal;
            }
        };
        ctrl.isReverseSorting = false;
        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.nameValidationPattern = ValidatingPatternsService.name;
        ctrl.searchStates = {};
        ctrl.searchKeys = ['metadata.name', 'spec.displayName', 'spec.description'];
        ctrl.selectedProject = {};
        ctrl.sortOptions = [{
            label: $i18next.t('common:NAME', { lng: lng }),
            value: 'spec.displayName',
            active: true
        }, {
            label: $i18next.t('common:DESCRIPTION', { lng: lng }),
            value: 'spec.description',
            active: false
        }, {
            label: $i18next.t('common:CREATED_BY', { lng: lng }),
            value: 'spec.created_by',
            active: false
        }, {
            label: $i18next.t('functions:CREATED_DATE', { lng: lng }),
            value: 'spec.created_date',
            active: false
        }];
        ctrl.sortedColumnName = 'spec.displayName';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;

        ctrl.createFunction = createFunction;
        ctrl.handleAction = handleAction;
        ctrl.importProject = importProject;
        ctrl.isProjectsListEmpty = isProjectsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onSelectDropdownAction = onSelectDropdownAction;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewProjectDialog = openNewProjectDialog;
        ctrl.refreshProjects = refreshProjects;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // initializes projects actions array
            ctrl.actions = initActions();

            // TODO pagination

            updateProjects();

            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox-all_checked-items-count-change', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', updatePanelActions);
        }

        /**
         * Changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.projects) && !lodash.isEmpty(changes.projects.currentValue)) {
                ctrl.projects = $filter('orderBy')(ctrl.projects, getName, ctrl.isReverseSorting);
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            ngDialog.close();
        }

        //
        // Public methods
        //

        /**
         * Updates current projects
         */
        function updateProjects() {
            ctrl.isSplashShowed.value = true;

            ctrl.getProjects().finally(function () {
                ctrl.isSplashShowed.value = false;
            });
        }

        /**
         * Navigates to New Function screen
         */
        function createFunction() {
            $state.go('app.create-function', {
                navigatedFrom: 'projects'
            });
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - e.g. `'delete'`, `'edit'`
         * @param {Array} projects - an array of checked projects
         * @returns {Promise}
         */
        function handleAction(actionType, projects) {
            var errorMessages = [];
            var promises = lodash.map(projects, function (project) {
                var projectName = getName(project);
                return lodash.result(project, 'ui.' + actionType).then(function (result) {
                    if (actionType === 'edit') {

                        // update the row in view
                        lodash.merge(project, result);
                    } else if (actionType === 'delete') {

                        // un-check project
                        if (project.ui.checked) {
                            project.ui.checked = false;

                            ActionCheckboxAllService.changeCheckedItemsCount(-1);
                        }

                        // remove from list
                        lodash.pull(ctrl.projects, project);
                    }
                }).catch(function (errorMessage) {
                    errorMessages.push(projectName + ': ' + errorMessage);
                });
            });

            return $q.all(promises).then(function () {
                if (lodash.isNonEmpty(errorMessages)) {
                    return DialogsService.alert(errorMessages);
                }
            });
        }

        /**
         * Imports project and updates the projects list
         * @param {File} file
         */
        function importProject(file) {
            ImportService.importFile(file).then(updateProjects);
        }

        /**
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isProjectsListEmpty() {
            return lodash.isEmpty(ctrl.projects);
        }

        /**
         * Updates projects list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');
        }

        /**
         * Sorts the table by column name depends on selected value in sort dropdown
         * @param {Object} option
         */
        function onSortOptionsChange(option) {
            var previousElement = lodash.find(ctrl.sortOptions, ['active', true]);
            var newElement = lodash.find(ctrl.sortOptions, ['label', option.label]);

            // change state of selected element, and of previous element
            previousElement.active = false;
            newElement.active = true;

            // if previous value is equal to new value, then change sorting predicate
            if (previousElement.label === newElement.label) {
                newElement.desc = !option.desc;
            }

            ctrl.isReverseSorting = newElement.desc;
            ctrl.sortedColumnName = newElement.value;

            ctrl.sortTableByColumn(ctrl.sortedColumnName);
        }

        /**
         * Called when dropdown action is selected
         * @param {Object} item - selected action
         */
        function onSelectDropdownAction(item) {
            if (item.id === 'exportProjects') {
                ExportService.exportProjects(ctrl.projects, ctrl.getFunctions);
            } else if (item.id === 'importProject') {
                angular.element($element.find('.project-import-input'))[0].click();
            }
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
        }

        /**
         * Handles on update filters counter
         * @param {string} searchQuery
         */
        function onUpdateFiltersCounter(searchQuery) {
            ctrl.filtersCounter = lodash.isEmpty(searchQuery) ? 0 : 1;
        }

        /**
         * Creates and opens new project dialog
         */
        function openNewProjectDialog() {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)" ' + 'data-create-project-callback="ngDialogData.createProject({project: project})">' + '</ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createProject: ctrl.createProject
                },
                className: 'ngdialog-theme-nuclio nuclio-project-create-dialog'
            }).closePromise.then(function (data) {
                if (!lodash.isNil(data.value)) {
                    updateProjects();
                }
            });
        }

        /**
         * Refreshes users list
         */
        function refreshProjects() {
            updateProjects();
        }

        /**
         * Sorts the table by column name
         * @param {string} columnName - name of column
         * @param {boolean} isJustSorting - if it is needed just to sort data without changing reverse
         */
        function sortTableByColumn(columnName, isJustSorting) {
            var expression = columnName === 'spec.displayName' ? getName : columnName;

            if (!isJustSorting) {
                // changes the order of sorting the column
                ctrl.isReverseSorting = columnName === ctrl.sortedColumnName ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            ctrl.projects = $filter('orderBy')(ctrl.projects, expression, ctrl.isReverseSorting);
        }

        /**
         * Show/hide filters panel
         */
        function toggleFilters() {
            ctrl.isFiltersShowed.value = !ctrl.isFiltersShowed.value;
        }

        //
        // Private methods
        //

        /**
         * Returns correct project name
         * @param {Object} project
         * @returns {string}
         */
        function getName(project) {
            return lodash.defaultTo(project.spec.displayName, project.metadata.name);
        }

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {string} data.action - a name of action
         */
        function onFireAction(event, data) {
            ctrl.handleAction(data.action, lodash.filter(ctrl.projects, 'ui.checked'));
        }

        /**
         * Actions for Action panel
         * @returns {Object[]}
         */
        function initActions() {
            return [{
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('functions:DELETE_PROJECTS_CONFIRM', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'nuclio_alert'
                }
            }, {
                label: $i18next.t('common:EDIT', { lng: lng }),
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: $i18next.t('common:EXPORT', { lng: lng }),
                id: 'export',
                icon: 'igz-icon-export-yml',
                active: true
            }];
        }

        /**
         * Updates actions of action panel according to selected nodes
         * @param {Object} event - triggering event
         * @param {Object} data - passed data
         */
        function updatePanelActions(event, data) {
            var checkedRows = lodash.filter(ctrl.projects, 'ui.checked');
            var checkedRowsCount = data.checkedCount;

            if (checkedRowsCount > 0) {

                // sets visibility status of `edit action`
                // visible if only one project is checked
                var editAction = lodash.find(ctrl.actions, { 'id': 'edit' });
                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRowsCount === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.actions, { 'id': 'delete' });
                if (!lodash.isNil(deleteAction)) {
                    var message = checkedRowsCount === 1 ? $i18next.t('functions:DELETE_PROJECT', { lng: lng }) + ' “' + getName(checkedRows[0]) + '”?' : $i18next.t('functions:DELETE_PROJECTS_CONFIRM', { lng: lng });

                    deleteAction.confirm = {
                        message: message,
                        description: $i18next.t('functions:DELETE_PROJECT_DESCRIPTION', { lng: lng }),
                        yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                        noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                        type: 'nuclio_alert'
                    };
                }
            }
        }
    }
})();
'use strict';

/* eslint-disable */

(function () {
    'use strict';

    ConverterService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('ConverterService', ConverterService);

    function ConverterService(lodash) {
        return {
            getConvertedBytes: getConvertedBytes,
            toNumberArray: toNumberArray,
            toStringArray: toStringArray
        };

        //
        // Public methods
        //

        /**
         * Method converts bytes into appropriate value
         * @param {number} bytes - number of bytes
         * @param {Array} [unit] - units
         * @returns {Object} object witch contains converted value, label for converted value and pow number
         */
        function getConvertedBytes(bytes, unit) {
            if (bytes === 0 || !angular.isNumber(bytes) || !isFinite(bytes)) {
                if (angular.isDefined(unit)) {
                    return {
                        value: 0,
                        label: lodash.first(unit),
                        pow: 0
                    };
                }

                return {
                    value: 1025,
                    label: angular.isDefined(unit) ? lodash.last(unit) : 'GB/s',
                    pow: 3
                };
            }

            var units = lodash.defaultTo(unit, ['bytes', 'KB/s', 'MB/s', 'GB/s']);
            var number = Math.floor(Math.log(bytes) / Math.log(1024));

            // max available value is 1024 GB/s
            if (number > 3) {
                number = 3;
                bytes = Math.pow(1024, Math.floor(number + 1));
            }

            return { value: Math.round(bytes / Math.pow(1024, Math.floor(number))), label: units[number], pow: number };
        }

        /**
         * Converts a comma-delimited string of numbers and number ranges (X-Y) to an array of `Number`s
         * @param {string} ranges - a comma-separated string (might pad commas with spaces) consisting of either
         *     a single number, or two numbers with a hyphen between them, where the smaller number comes first
         *     (ranges where the first number is smaller than the second number will be ignored)
         * @returns {Array.<number>} an array of numbers representing all the numbers referenced in `ranges` param
         **/
        function toNumberArray(ranges) {
            return lodash.chain(ranges).replace(/\s+/g, '') // get rid of all white-space characters
            .trim(',') // get rid of leading and trailing commas
            .split(',') // get an array of strings, for each string that is between two comma delimiters
            .map(function (range) {
                // for each string - convert it to a number or an array of numbers
                // if it is a sequence of digits - convert it to a `Number` value and return it
                if (/^\d+$/g.test(range)) {
                    return Number(range);
                }

                // otherwise, attempt to parse it as a range of numbers (two sequences of digits delimited by a
                // single hyphen)
                var matches = range.match(/^(\d+)-(\d+)$/);

                // attempt to convert both sequences of digits to `Number` values
                var start = Number(lodash.get(matches, '[1]'));
                var end = Number(lodash.get(matches, '[2]'));

                // if any attempt above fails - return `null` to indicate a value that needs to be ignored later
                // otherwise, return a range of `Number`s represented by that range
                // (e.g. `'1-3'` is `[1, 2, 3]`)
                return Number.isNaN(start) || Number.isNaN(end) || start > end ? null : lodash.range(start, end + 1);
            }).flatten() // make a single flat array (e.g. `[1, [2, 3], 4, [5, 6]]` to `[1, 2, 3, 4, 5, 6]`)
            .without(false, null, '', undefined, NaN) // get rid of `null` values (e.g. `[null, 1, null, 2, 3, null]` to `[1, 2, 3]`)
            .uniq() // get rid of duplicate values (e.g. `[1, 2, 2, 3, 4, 4, 5]` to `[1, 2, 3, 4, 5]`)
            .sortBy() // sort the list in ascending order (e.g. `[4, 1, 5, 3, 2, 6]` to`[1, 2, 3, 4, 5, 6]`)
            .value();
        }

        /**
         * Converts a `string` consisting of a comma-delimited list into an array of strings (whitespace is trimmed).
         * If `value` is not a `string`, it will be returned as-is.
         * @param {string|*} value - the string to convert.
         * @returns {Array.<string>|*} an array of strings representing the comma-delimited list in `value`, or `value`
         *     as-is if it is not a `string`.
         * @example
         * toStringArray('  foo,bar   ,  baz,  waz  ,bla  ');
         * // => ['foo', 'bar', 'baz', 'waz', 'bla']
         *
         * toStringArray('  ,  ');
         * // => []
         *
         * toStringArray('    ');
         * // => []
         *
         * toStringArray('');
         * // => []
         *
         * toStringArray(123);
         * // => 123
         *
         * toStringArray(false);
         * // => false
         *
         * toStringArray({ foo: 'bar' });
         * // => { foo: 'bar' }
         *
         * toStringArray([123, 456]);
         * // => [123, 456]
         *
         * toStringArray(/abc/g);
         * // => abc/g
         *
         * toStringArray(null);
         * // => null
         *
         * toStringArray(undefined);
         * // => undefined
         */
        function toStringArray(value) {
            return lodash.isString(value) ? lodash.without(value.trim().split(/\s*,\s*/), '') : value;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    ExportService.$inject = ['$q', '$timeout', '$i18next', 'i18next', 'DialogsService', 'lodash', 'YAML'];
    angular.module('iguazio.dashboard-controls').factory('ExportService', ExportService);

    function ExportService($q, $timeout, $i18next, i18next, DialogsService, lodash, YAML) {
        return {
            exportFunction: exportFunction,
            getFunctionConfig: getFunctionConfig,
            exportProject: exportProject,
            exportProjects: exportProjects
        };

        //
        // Public methods
        //

        /**
         * Exports the function
         * @param {Object} version
         */
        function exportFunction(version) {
            var functionToExport = prepareFunctionData(version);
            var blob = prepareBlobObject(functionToExport);

            downloadExportedFunction(blob, version.metadata.name);
        }

        /**
         * Returns function config
         * @param {Object} version
         * @returns {string} YAML object
         */
        function getFunctionConfig(version) {
            var functionConfig = prepareFunctionData(version);

            return prepareYamlObject(functionConfig);
        }

        /**
         * Exports the project
         * @param {Object} project
         * @param {Function} getFunctions
         */
        function exportProject(project, getFunctions) {
            getFunctions({ id: project.metadata.name }).then(function (functions) {
                var functionsList = lodash.map(functions, function (functionItem) {
                    return lodash.chain(functionItem).set('spec.version', 1).omit(['status', 'metadata.namespace']).value();
                });

                var projectToExport = {
                    project: {
                        metadata: {
                            name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                        },
                        spec: {
                            functions: functionsList
                        }
                    }
                };

                var blob = prepareBlobObject(projectToExport);

                downloadExportedFunction(blob, lodash.defaultTo(project.spec.displayName, project.metadata.name));
            }).catch(function (error) {
                var msg = $i18next.t('functions:ERROR_MSG.EXPORT_PROJECT', { lng: i18next.language });
                DialogsService.alert(lodash.get(error, 'data.error', msg));
            });
        }

        /**
         * Exports projects
         * @param {Object} projects
         * @param {Function} getFunctions
         */
        function exportProjects(projects, getFunctions) {
            var promises = lodash.map(projects, function (project) {
                return getFunctions({ id: project.metadata.name }).then(function (functions) {
                    var functionsList = lodash.map(functions, function (functionItem) {
                        return lodash.chain(functionItem).set('spec.version', 1).omit(['status', 'metadata.namespace']).value();
                    });

                    return {
                        metadata: {
                            name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                        },
                        spec: {
                            functions: functionsList
                        }
                    };
                }).catch(angular.noop);
            });

            $q.all(promises).then(function (projectsToExport) {
                var blob = prepareBlobObject({
                    projects: lodash.compact(projectsToExport)
                });

                downloadExportedFunction(blob, 'projects');
            }).catch(function (error) {
                var msg = $i18next.t('functions:ERROR_MSG.EXPORT_PROJECTS', { lng: i18next.language });
                DialogsService.alert(lodash.get(error, 'data.error', msg));
            });
        }

        //
        // Private methods
        //

        /**
         * Creates artificial link and starts downloading of exported function.
         * Downloaded .yaml file will be saved in user's default folder for downloads.
         * @param {Blob} data - exported function config parsed to YAML
         * @param {string} fileName - name of the file
         */
        function downloadExportedFunction(data, fileName) {
            var url = URL.createObjectURL(data);
            var link = document.createElement('a');

            link.href = url;
            link.download = fileName + '.yaml';
            document.body.appendChild(link);

            $timeout(function () {
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            });
        }

        /**
         * Returns valid YAML string.
         * First RegExp deletes all excess lines in YAML string created by issue in yaml.js package.
         * It is necessary to generate valid YAML.
         * Example:
         * -
         *   name: name
         *   value: value
         * -
         *   name: name
         *   value: value
         * Will transform in:
         * - name: name
         *   value: value
         * - name: name
         *   value: value
         * Second and Third RegExp replaces all single quotes on double quotes.
         * Example:
         * 'key': 'value' -> "key": "value"
         * Fourth RegExp replaces all pairs of single quotes on one single quote.
         * It needs because property name or property value is a sting which contains single quote
         * will parsed by yaml.js package in string with pair of single quotes.
         * Example:
         * "ke'y": "val'ue"
         * After will parse will be -> "ke''y": "val''ue"
         * This RegExp will transform it to normal view -> "ke'y": "val'ue"
         * @param {string} data - incoming YAML-string
         * @returns {string}
         */
        function getValidYaml(data) {
            return data.replace(/(\s+\-)\s*\n\s+/g, '$1 ').replace(/'(.+)'(:)/g, '\"$1\"$2').replace(/(:\s)'(.+)'/g, '$1\"$2\"').replace(/'{2}/g, '\'');
        }

        /**
         * Prepare function data
         * @param {Object} version
         * @returns {Object} data for export
         */
        function prepareFunctionData(version) {
            var versionCopy = angular.copy(version);

            if (lodash.has(versionCopy, 'spec.build.commands')) {
                lodash.forEach(versionCopy.spec.build.commands, function (command, index) {
                    versionCopy.spec.build.commands[index] = command.replace(/'/g, '\'\'');
                });
            }

            // using `angular.fromJson` & `angular.toJson` to easily get rid of `$$hashKey` property in all levels
            return angular.fromJson(angular.toJson({
                metadata: lodash.omit(versionCopy.metadata, 'namespace'),
                spec: lodash.omit(versionCopy.spec, 'build.noBaseImagesPull')
            }));
        }

        /**
         * Prepare YAML object
         * @param {Object} objectToParse
         * @returns {string} YAML object
         */
        function prepareYamlObject(objectToParse) {
            var parsedObject = YAML.stringify(objectToParse, Infinity, 2);

            return getValidYaml(parsedObject);
        }
        /**
         * Prepare blob object for downloading
         * @param {Object} objectToParse
         * @returns {Blob} Blob object
         */
        function prepareBlobObject(objectToParse) {
            var parsedObject = prepareYamlObject(objectToParse);

            return new Blob([parsedObject], {
                type: 'application/json'
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NuclioHeaderService.$inject = ['$rootScope', '$state', 'lodash'];
    angular.module('iguazio.dashboard-controls').factory('NuclioHeaderService', NuclioHeaderService);

    function NuclioHeaderService($rootScope, $state, lodash) {
        return {
            updateMainHeader: updateMainHeader
        };

        //
        // Public methods
        //

        /**
         * Sends broadcast with needed data object to dynamically update main header title
         * @param {string} title
         * @param {string} subtitles
         * @param {string} state
         */
        function updateMainHeader(title, subtitles, state) {
            var mainHeaderState = lodash.find($state.get(), function (mainState) {
                return mainState.url === lodash.trim($state.$current.url.prefix, '/');
            }).name;

            var mainHeaderTitle = {
                title: title,
                project: subtitles.project,
                function: null,
                version: null,
                state: state,
                mainHeaderState: mainHeaderState
            };

            if (!lodash.isNil(subtitles.function)) {
                mainHeaderTitle.function = subtitles.function;

                if (!lodash.isNil(subtitles.version)) {
                    mainHeaderTitle.version = subtitles.version;
                }
            }

            $rootScope.$broadcast('update-main-header-title', mainHeaderTitle);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    VersionHelperService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('VersionHelperService', VersionHelperService);

    function VersionHelperService(lodash) {
        return {
            updateIsVersionChanged: updateIsVersionChanged
        };

        //
        // Public methods
        //

        /**
         * Updates "version changed" indicator of `version`. Sets it to `true` in case working version differs from
         * deployed one, or `false` otherwise.
         * @param {Object} version - the working function's version.
         * @param {Object} version.ui.deployedVersion - latest deployed function's version.
         */
        function updateIsVersionChanged(version) {
            var working = cloneObject(lodash.omit(version, 'ui'));
            var deployed = cloneObject(lodash.omit(version.ui.deployedVersion, 'ui'));
            version.ui.versionChanged = !lodash.isEqual(working, deployed);
        }

        //
        // Private methods
        //

        /**
         * Creates objects copy
         * Recursively copies all properties which are not empty objects or empty strings
         * as they are not needed for comparison
         * @param {Object} obj - an object which must be copied
         * @returns {Object} newObj - copy of obj without empty objects and strings
         */
        function cloneObject(obj) {

            // omits all empty values
            var newObj = lodash.omitBy(obj, function (value) {
                return lodash.isObject(value) || lodash.isString(value) ? lodash.isEmpty(value) : false;
            });

            lodash.forOwn(newObj, function (value, key) {

                // recursively copies nested objects
                if (lodash.isObject(value)) {
                    newObj[key] = cloneObject(value);
                }
            });

            return newObj;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzEditProjectDialogController.$inject = ['$scope', '$i18next', 'i18next', 'lodash', 'EventHelperService', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('nclEditProjectDialog', {
        bindings: {
            project: '<',
            confirm: '&',
            closeDialog: '&',
            updateProjectCallback: '&'
        },
        templateUrl: 'nuclio/projects/edit-project-dialog/edit-project-dialog.tpl.html',
        controller: IgzEditProjectDialogController
    });

    function IgzEditProjectDialogController($scope, $i18next, i18next, lodash, EventHelperService, FormValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.data = {};
        ctrl.isLoadingState = false;
        ctrl.nameTakenError = false;
        ctrl.serverError = '';

        ctrl.$onInit = onInit;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isServerError = isServerError;
        ctrl.onClose = onClose;
        ctrl.saveProject = saveProject;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.data = lodash.cloneDeep(ctrl.project);
        }

        //
        // Public methods
        //

        /**
         * Handle click on `Apply changes` button or press `Enter`
         * @param {Event} [event]
         */
        function saveProject(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                $scope.editProjectForm.$submitted = true;

                if ($scope.editProjectForm.$valid) {
                    ctrl.isLoadingState = true;

                    // use data from dialog to create a new project
                    var newProjectState = lodash.omit(ctrl.data, 'ui');
                    ctrl.updateProjectCallback({ project: newProjectState }).then(function () {
                        ctrl.confirm({ project: newProjectState });
                    }).catch(function (error) {
                        var status = lodash.get(error, 'status');

                        ctrl.serverError = status === 400 ? $i18next.t('common:ERROR_MSG.MISSING_MANDATORY_FIELDS', { lng: lng }) : status === 403 ? $i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.403', { lng: lng }) : status === 405 ? $i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.405', { lng: lng }) : status === 409 ? $i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.409', { lng: lng }) : lodash.inRange(status, 500, 599) ? $i18next.t('common:ERROR_MSG.SERVER_ERROR', { lng: lng }) : $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR_RETRY_LATER', { lng: lng });

                        if (status === 409) {
                            ctrl.nameTakenError = true;
                        }
                    }).finally(function () {
                        ctrl.isLoadingState = false;
                    });
                }
            }
        }

        /**
         * Sets new data from input field for corresponding field of current project
         * @param {string} newData - new string value which should be set
         * @param {string} field - field name, ex. `name`, `description`
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.data, field, newData);
        }

        /**
         * Checks if server error is present or not
         * @returns {boolean}
         */
        function isServerError() {
            return ctrl.serverError !== '';
        }

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog({ value: 'closed' });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzNewProjectDialogController.$inject = ['$scope', '$i18next', 'i18next', 'lodash', 'moment', 'ConfigService', 'DialogsService', 'EventHelperService', 'FormValidationService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclNewProjectDialog', {
        bindings: {
            closeDialog: '&',
            createProjectCallback: '&'
        },
        templateUrl: 'nuclio/projects/new-project-dialog/new-project-dialog.tpl.html',
        controller: IgzNewProjectDialogController
    });

    function IgzNewProjectDialogController($scope, $i18next, i18next, lodash, moment, ConfigService, DialogsService, EventHelperService, FormValidationService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.data = {};
        ctrl.isLoadingState = false;
        ctrl.nameTakenError = false;
        ctrl.nameValidationPattern = ValidatingPatternsService.functionName;
        ctrl.serverError = '';

        ctrl.$onInit = onInit;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.createProject = createProject;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isServerError = isServerError;
        ctrl.onClose = onClose;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.data = getBlankData();
        }

        //
        // Public methods
        //

        /**
         * Handle click on `Create project` button or press `Enter`
         * @param {Event} [event]
         */
        function createProject(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                $scope.newProjectForm.$submitted = true;

                if ($scope.newProjectForm.$valid) {
                    ctrl.isLoadingState = true;

                    if (ConfigService.isDemoMode()) {
                        lodash.defaultsDeep(ctrl.data, {
                            spec: {
                                created_by: 'admin',
                                created_date: moment().toISOString()
                            }
                        });
                    }

                    // use data from dialog to create a new project
                    ctrl.createProjectCallback({ project: ctrl.data }).then(function () {
                        ctrl.closeDialog({ project: ctrl.data });
                    }).catch(function (error) {
                        var status = lodash.get(error, 'status');

                        ctrl.serverError = status === 400 ? $i18next.t('common:ERROR_MSG.MISSING_MANDATORY_FIELDS', { lng: lng }) : status === 403 ? $i18next.t('functions:ERROR_MSG.CREATE_PROJECT.403', { lng: lng }) : status === 405 ? $i18next.t('functions:ERROR_MSG.CREATE_PROJECT.405', { lng: lng }) : status === 409 ? $i18next.t('functions:ERROR_MSG.CREATE_PROJECT.409', { lng: lng }) : lodash.inRange(status, 500, 599) ? $i18next.t('common:ERROR_MSG.SERVER_ERROR', { lng: lng }) : $i18next.t('common:ERROR_MSG.UNKNOWN_ERROR_RETRY_LATER', { lng: lng });

                        if (status === 409) {
                            ctrl.nameTakenError = true;
                        }
                    }).finally(function () {
                        ctrl.isLoadingState = false;
                    });
                }
            }
        }

        /**
         * Sets new data from input field for corresponding field of new project
         * @param {string} newData - new string value which should be set
         * @param {string} field - field name, ex. `name`, `description`
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.data, field, newData);
        }

        /**
         * Checks if server error is present or not
         * @returns {boolean}
         */
        function isServerError() {
            return ctrl.serverError !== '';
        }

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog();
            }
        }

        //
        // Private method
        //

        /**
         * Gets black data
         * @returns {Object} - black data
         */
        function getBlankData() {
            return {
                metadata: {
                    name: ''
                },
                spec: {
                    description: ''
                }
            };
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('nclProject', {
        bindings: {},
        templateUrl: 'nuclio/projects/project/ncl-project.tpl.html',
        controller: NclProjectController
    });

    function NclProjectController() {
        var ctrl = this;
    }
})();
'use strict';

(function () {
    'use strict';

    NclProjectsTableRowController.$inject = ['$q', '$scope', '$state', '$i18next', 'i18next', 'lodash', 'moment', 'ngDialog', 'ConfigService', 'ExportService'];
    angular.module('iguazio.dashboard-controls').component('nclProjectsTableRow', {
        bindings: {
            project: '<',
            projectsList: '<',
            actionHandlerCallback: '&',
            deleteProject: '&',
            updateProject: '&',
            getFunctions: '&'
        },
        templateUrl: 'nuclio/projects/projects-table-row/projects-table-row.tpl.html',
        controller: NclProjectsTableRowController
    });

    function NclProjectsTableRowController($q, $scope, $state, $i18next, i18next, lodash, moment, ngDialog, ConfigService, ExportService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = {};

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.showDetails = showDetails;
        ctrl.onFireAction = onFireAction;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {

            // initialize `checked` status to `false`
            lodash.defaultsDeep(ctrl.project, {
                ui: {
                    checked: false
                }
            });

            // assign `deleteProject`, `editProject`, `exportProject` actions to `ui` property of current project
            lodash.assign(ctrl.project.ui, {
                'delete': handleDeleteProject,
                'edit': editProject,
                'export': exportProject
            });

            if (ConfigService.isDemoMode()) {
                lodash.defaultsDeep(ctrl.project, {
                    spec: {
                        created_by: 'admin',
                        created_date: moment().toISOString()
                    }
                });
            }

            ctrl.actions = initActions();
        }

        //
        // Public method
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.project] });
        }

        /**
         * Handles mouse click on a project name
         * Navigates to Functions page
         * @param {MouseEvent} event
         * @param {string} [state=app.project.functions] - absolute state name or relative state path
         */
        function showDetails(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.functions';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                projectId: ctrl.project.metadata.name
            });
        }

        //
        // Private methods
        //

        /**
         * Deletes project from projects list
         * @returns {Promise}
         */
        function handleDeleteProject() {
            var projectId = lodash.get(ctrl.project, 'metadata.name');

            return ctrl.deleteProject({ project: ctrl.project }).then(function () {
                return projectId;
            }).catch(function (error) {
                var status = lodash.get(error, 'status');
                var errorMessage = status === 409 ? $i18next.t('functions:ERROR_MSG.DELETE_PROJECT.409', { lng: lng }) : $i18next.t('functions:ERROR_MSG.DELETE_PROJECT.DEFAULT', { lng: lng });
                return $q.reject(errorMessage);
            });
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [{
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('functions:DELETE_PROJECT', { lng: lng }) + ' “' + lodash.defaultTo(ctrl.project.spec.displayName, ctrl.project.metadata.name) + '“?',
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    description: $i18next.t('functions:DELETE_PROJECT_DESCRIPTION', { lng: lng }),
                    type: 'nuclio_alert'
                }
            }, {
                label: $i18next.t('common:EDIT', { lng: lng }),
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: $i18next.t('common:EXPORT', { lng: lng }),
                id: 'export',
                icon: 'igz-icon-export-yml',
                active: true
            }];
        }

        /**
         * Opens `Edit project` dialog
         */
        function editProject() {
            return ngDialog.openConfirm({
                template: '<ncl-edit-project-dialog ' + 'data-project="$ctrl.project"' + 'data-confirm="confirm(project)" ' + 'data-close-dialog="closeThisDialog(value)" ' + 'data-update-project-callback="ngDialogData.updateProject({project: project})">' + '</ncl-edit-project-dialog>',
                plain: true,
                data: {
                    updateProject: ctrl.updateProject
                },
                scope: $scope,
                className: 'ngdialog-theme-nuclio nuclio-project-edit-dialog'
            }).catch(function (error) {
                if (error !== 'closed') {
                    return $q.reject($i18next.t('functions:ERROR_MSG.UPDATE_PROJECT.DEFAULT', { lng: lng }));
                }
            });
        }

        /**
         * Exports the project
         */
        function exportProject() {
            ExportService.exportProject(ctrl.project, ctrl.getFunctions);
            return $q.when();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclProjectsWelcomePageController.$inject = ['$scope', '$state', 'ngDialog', 'ImportService'];
    angular.module('iguazio.dashboard-controls').component('nclProjectsWelcomePage', {
        bindings: {
            createProject: '&'
        },
        templateUrl: 'nuclio/projects/projects-welcome-page/projects-welcome-page.tpl.html',
        controller: NclProjectsWelcomePageController
    });

    function NclProjectsWelcomePageController($scope, $state, ngDialog, ImportService) {
        var ctrl = this;

        ctrl.$onDestroy = onDestroy;

        ctrl.importProject = importProject;
        ctrl.openNewProjectDialog = openNewProjectDialog;

        //
        // Hook method
        //

        /**
         * Destructor method
         */
        function onDestroy() {
            ngDialog.close();
        }

        //
        // Public method
        //

        /**
         * Imports project and navigates to `projects` screen
         * @param {File} file
         */
        function importProject(file) {
            ImportService.importFile(file).then(function () {
                $state.go('app.projects');
            });
        }

        /**
         * Handle click on `Create new project` button
         * @param {Object} event
         */
        function openNewProjectDialog(event) {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)" ' + 'data-create-project-callback="ngDialogData.createProject({project: project})"></ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createProject: ctrl.createProject
                },
                className: 'ngdialog-theme-nuclio new-project-dialog-wrapper'
            }).closePromise.then(function () {
                $state.go('app.projects');
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    require.config({ paths: { 'vs': '/assets/monaco-editor/min/vs' } });

    angular.module('iguazio.dashboard-controls').directive('igzMonacoEditor', ['$interval', 'lodash', function ($interval, lodash) {
        function link(scope, element, attrs) {
            var editorElement = element[0];
            var interval = null;
            require(['vs/editor/editor.main'], function () {
                var editorContext = {
                    scope: scope,
                    element: element,
                    attrs: attrs,
                    getValueOrDefault: function getValueOrDefault(value, defaultValue) {
                        if (angular.isUndefined(value) || value === null) {
                            return defaultValue;
                        } else {
                            return value;
                        }
                    },
                    onThemeChanged: function onThemeChanged(newValue, oldValue) {
                        window.monaco.editor.setTheme(this.getValueOrDefault(newValue, 'vs-dark'));
                    },
                    onFileLanguageChanged: function onFileLanguageChanged(newValue) {

                        // update the language model (and set `insertSpaces`)
                        var newModel = window.monaco.editor.createModel('', newValue.language);
                        newModel.updateOptions({ insertSpaces: this.getValueOrDefault(newValue.useSpaces, true) });
                        this.editor.setModel(newModel);

                        // update the code
                        this.editor.setValue(scope.codeFile.code);
                    },
                    onCodeFileChanged: function onCodeFileChanged() {
                        if (!lodash.isEqual(this.editor.getValue(), scope.codeFile.code)) {
                            this.editor.setValue(scope.codeFile.code);
                        }
                    },
                    onReadOnlyCodeFileChanged: function onReadOnlyCodeFileChanged() {
                        this.editor.setValue(scope.codeFile.code);
                    },
                    onWrapStateChanged: function onWrapStateChanged(newState) {
                        this.editor.updateOptions({ wordWrap: newState ? 'on' : 'off' });
                    },
                    onFontSizeChanged: function onFontSizeChanged(newFontSize) {
                        this.editor.updateOptions({ fontSize: newFontSize });
                    }
                };

                editorContext.editor = window.monaco.editor.defineTheme('custom-vs', {
                    base: 'vs',
                    inherit: true,
                    rules: [{ token: '', foreground: '474056', background: 'ffffff' }, { token: 'number', foreground: '474056' }, { token: 'delimiter', foreground: '474056' }, { token: 'string', foreground: '21d4ac' }],
                    colors: {
                        'editor.foreground': '#474056',
                        'editor.background': '#ffffff',
                        'editorLineNumber.foreground': '#474056',
                        'editorGutter.background': '#e1e0e5',
                        'textBlockQuote.border': '#ffffff',
                        'editorCursor.foreground': '#8B0000',
                        'editor.lineHighlightBackground': '#e1e0e5',
                        'editorMarkerNavigation.background': '#000000',
                        'editor.selectionBackground': '#239bca',
                        'editorIndentGuide.background': '#e1e0e5'
                    }
                });

                editorContext.editor = window.monaco.editor.create(editorElement, {
                    value: scope.codeFile.code,
                    language: scope.fileLanguage.language,
                    theme: 'vs',
                    automaticLayout: true,
                    dragAndDrop: true,
                    lineNumbersMinChars: scope.miniMonaco ? 2 : 5,
                    lineNumbers: scope.miniMonaco && !scope.showLineNumbers ? 'off' : 'on', // hide line number if it's a mini-monaco
                    minimap: {
                        enabled: !scope.miniMonaco // hide mini-map if it's a mini-monaco
                    },
                    readOnly: scope.readOnly,
                    wordWrap: scope.wordWrap ? 'on' : 'off'
                });

                // change content callback
                editorContext.editor.onDidChangeModelContent(function () {

                    // call callback from upper scope (monaco component) with new changed code
                    scope.onCodeChange(editorContext.editor.getValue());
                });

                // set up watch for codeFile changes to reflect updates
                scope.$watch('fileLanguage', editorContext.onFileLanguageChanged.bind(editorContext));
                scope.$watch('editorTheme', editorContext.onThemeChanged.bind(editorContext));
                scope.$watch('wordWrap', editorContext.onWrapStateChanged.bind(editorContext));
                scope.$watch('codeFile', editorContext.onCodeFileChanged.bind(editorContext));
                scope.$watch('fontSize', editorContext.onFontSizeChanged.bind(editorContext));

                scope.$on('function-import-source-code', editorContext.onReadOnlyCodeFileChanged.bind(editorContext));

                scope.$on('$destroy', function () {
                    if (interval !== null) {
                        $interval.cancel(interval);
                        interval = null;
                    }
                });
            });
        }

        return {
            link: link,
            scope: {
                codeFile: '=codeFile',
                editorTheme: '=editorTheme',
                fontSize: '=fontSize',
                fileLanguage: '=fileLanguage',
                miniMonaco: '=miniMonaco',
                showLineNumbers: '=showLineNumbers',
                onCodeChange: '=onCodeChange',
                readOnly: '=readOnly',
                wordWrap: '=wordWrap'
            }
        };
    }]);

    require(['vs/editor/editor.main'], function () {
        window.monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: function provideCompletionItems() {
                return [{
                    label: 'def',
                    kind: window.monaco.languages.CompletionItemKind.Keyword,
                    insertText: {
                        value: 'def ${1:name}():\r\t$0'
                    }
                }];
            }
        });
    });
})();
'use strict';

(function () {
    'use strict';

    NclBreadcrumbsController.$inject = ['$scope', '$state', '$transitions', 'lodash', 'NavigationTabsService'];
    angular.module('iguazio.dashboard-controls').component('nclBreadcrumbs', {
        bindings: {
            getProjects: '&',
            getFunctions: '&'
        },
        templateUrl: 'nuclio/common/components/breadcrumbs/breadcrumbs.tpl.html',
        controller: NclBreadcrumbsController
    });

    function NclBreadcrumbsController($scope, $state, $transitions, lodash, NavigationTabsService) {
        var ctrl = this;

        ctrl.mainHeaderTitle = {};

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.goToProjectsList = goToProjectsList;
        ctrl.goToFunctionsList = goToFunctionsList;
        ctrl.goToFunctionScreen = goToFunctionScreen;

        //
        // Hook methods
        //

        /**
         * Initialization function
         */
        function onInit() {
            setMainHeaderTitle();

            $scope.$on('update-main-header-title', setMainHeaderTitle);

            $transitions.onSuccess({}, onStateChangeSuccess);
        }

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.navigationTabsConfig = NavigationTabsService.getNavigationTabsConfig($state.current.name);
        }

        //
        // Public methods
        //

        /**
         * Changes state when the main header title is clicked
         */
        function goToProjectsList() {
            $state.go('app.projects');
        }

        /**
         * Changes state when the Project subtitle is clicked
         */
        function goToFunctionsList() {
            $state.go('app.project.functions');
        }

        function goToFunctionScreen() {
            $state.go('app.project.function.edit.code');
        }

        //
        // Private methods
        //

        /**
         * Dynamically set Main Header Title on broadcast and on initial page load
         * @param {Object} [event]
         * @param {Object} [data]
         */
        function setMainHeaderTitle(event, data) {
            if (!lodash.isNil(data)) {
                data = lodash.omitBy(data, lodash.isNil);

                lodash.assign(ctrl.mainHeaderTitle, data);
            } else {
                ctrl.mainHeaderTitle = { title: $state.current.data.mainHeaderTitle };
            }
        }

        /**
         * Dynamically pre-set Main Header Title on UI router state change, sets position of main wrapper and navigation
         * tabs config
         * Needed for better UX - header title changes correctly even before controller data resolved and broadcast
         * have been sent
         * @param {Object} transition
         */
        function onStateChangeSuccess(transition) {
            var toState = transition.$to();
            ctrl.navigationTabsConfig = NavigationTabsService.getNavigationTabsConfig(toState.name);

            // Check to exclude prototypical inheritance of the `mainHeaderTitle` property from parent router state
            if (toState.data.hasOwnProperty('mainHeaderTitle')) {

                ctrl.mainHeaderTitle = {
                    title: toState.data.mainHeaderTitle
                };
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclBreadcrumbsDropdown.$inject = ['$document', '$element', '$scope', '$state', '$i18next', 'i18next', 'lodash', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('nclBreadcrumbsDropdown', {
        bindings: {
            state: '<',
            title: '<',
            project: '<',
            type: '@',
            getFunctions: '&',
            getProjects: '&'
        },
        templateUrl: 'nuclio/common/components/breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
        controller: NclBreadcrumbsDropdown
    });

    function NclBreadcrumbsDropdown($document, $element, $scope, $state, $i18next, i18next, lodash, DialogsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.itemsList = [];
        ctrl.showDropdownList = false;
        ctrl.placeholder = $i18next.t('common:PLACEHOLDER.SEARCH', { lng: lng });

        ctrl.$onInit = onInit;

        ctrl.showDropdown = showDropdown;
        ctrl.showDetails = showDetails;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (ctrl.type === 'projects') {
                ctrl.getProjects().then(setNuclioItemsList).catch(function () {
                    DialogsService.alert($i18next.t('functions:ERROR_MSG.GET_PROJECTS', { lng: lng }));
                });
            } else if (ctrl.type === 'functions') {
                ctrl.getFunctions({ id: ctrl.project.metadata.name }).then(setNuclioItemsList).catch(function () {
                    DialogsService.alert($i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', { lng: lng }));
                });
            }

            $document.on('click', unselectDropdown);
        }

        //
        // Public method
        //

        /**
         * Opens/closes dropdown
         */
        function showDropdown() {
            $document.on('click', unselectDropdown);

            if (!ctrl.showDropdownList) {
                $element.find('.breadcrumb-arrow').css('background-color', '#c9c9cd');
            }

            ctrl.showDropdownList = !ctrl.showDropdownList;

            if (!ctrl.showDropdownList) {
                ctrl.searchText = '';

                $element.find('.breadcrumb-arrow').css('background-color', '');

                $document.off('click', unselectDropdown);
            }
        }

        /**
         * Handles mouse click on a item's name
         * Navigates to selected page
         * @param {Event} event
         * @param {Object} item
         */
        function showDetails(event, item) {
            var params = {};

            ctrl.showDropdownList = !ctrl.showDropdownList;
            ctrl.searchText = '';

            $document.off('click', unselectDropdown);

            $element.find('.breadcrumb-arrow').css('background-color', '');

            if (ctrl.type === 'projects') {
                lodash.set(params, 'projectId', item.id);

                $state.go('app.project.functions', params);
            } else if (ctrl.type === 'functions') {
                params = {
                    isNewFunction: false,
                    id: ctrl.project.metadata.name,
                    functionId: item.id,
                    projectNamespace: ctrl.project.metadata.namespace
                };

                $state.go('app.project.function.edit.code', params);
            }
        }

        //
        // Private method
        //

        /**
         * Handles promise
         * Sets projects list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setProjectsItemList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: lodash.defaultTo(item.spec.displayName, item.metadata.name),
                    isNuclioState: true
                };
            });
        }

        /**
         * Handles promise
         * Sets functions list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setFunctionsItemList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.metadata.name,
                    isNuclioState: true
                };
            });
        }

        /**
         * Checks what item list need to set for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setNuclioItemsList(data) {
            if (ctrl.type === 'projects') {
                setProjectsItemList(data);
            } else if (ctrl.type === 'functions') {
                setFunctionsItemList(lodash.defaultTo(data.data, data));
            }
        }

        /**
         * Handle click on the document and not on the dropdown field and close the dropdown
         * @param {Object} e - event
         */
        function unselectDropdown(e) {
            if ($element.find(e.target).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.showDropdownList = false;
                    ctrl.searchText = '';

                    $document.off('click', unselectDropdown);

                    $element.find('.breadcrumb-arrow').css('background-color', '');
                });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclCollapsingRowController.$inject = ['$timeout', '$i18next', 'i18next', 'lodash', 'DialogsService', 'FunctionsService'];
    angular.module('iguazio.dashboard-controls').component('nclCollapsingRow', {
        bindings: {
            actionHandlerCallback: '&',
            item: '<',
            type: '@',
            listClass: '@?'
        },
        templateUrl: 'nuclio/common/components/collapsing-row/collapsing-row.tpl.html',
        controller: NclCollapsingRowController,
        transclude: true
    });

    function NclCollapsingRowController($timeout, $i18next, i18next, lodash, DialogsService, FunctionsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [];
        ctrl.isEditModeActive = false;

        ctrl.$onInit = onInit;

        ctrl.isNil = lodash.isNil;

        ctrl.getAttributeValue = getAttributeValue;
        ctrl.isVolumeType = isVolumeType;
        ctrl.onCollapse = onCollapse;
        ctrl.onClickAction = onClickAction;
        ctrl.onFireAction = onFireAction;
        ctrl.showDotMenu = showDotMenu;
        ctrl.toggleItem = toggleItem;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.item, {
                ui: {
                    editModeActive: false,
                    expandable: true
                }
            });

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);

            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.className = ctrl.selectedClass.name;
            }

            ctrl.actions = initActions();
        }

        //
        // Public methods
        //

        /**
         * Returns attribute value
         * @param {string} key - attribute key
         * @param {string|Object} value - attribute value
         * @returns {string|Object}
         */
        function getAttributeValue(key, value) {
            return key === 'schedule' ? '0 ' + value : value;
        }

        /**
         * Checks if input have to be visible for specific item type
         * @param {string} name - input name
         * @returns {boolean}
         */
        function isVolumeType(name) {
            return ctrl.type === 'volume';
        }

        /**
         * Changes item's expanded state
         */
        function onCollapse(event) {
            if (!ctrl.item.ui.editModeActive) {
                ctrl.actionHandlerCallback({ actionType: 'edit', selectedItem: ctrl.item });
                event.stopPropagation();
            } else {
                $timeout(function () {
                    if (ctrl.item.ui.expandable) {
                        ctrl.item.ui.editModeActive = false;
                    }
                });
            }
        }

        /**
         * Handler on action click
         * @param {Object} action - action that was clicked (e.g. `delete`)
         */
        function onClickAction(action) {
            if (lodash.isNonEmpty(action.confirm)) {
                showConfirmDialog(action);
            } else {
                onFireAction(action.id);
            }
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, selectedItem: ctrl.item });
        }

        /**
         * Checks if show dot menu
         */
        function showDotMenu() {
            return ctrl.actions.length > 1;
        }

        /**
         * Enables/disables item
         */
        function toggleItem() {
            ctrl.item.enable = !ctrl.item.enable;
        }

        //
        // Private methods
        //

        /**
         * Shows confirm dialog
         * @param {Object} action - e.g. `delele`
         */
        function showConfirmDialog(action) {
            var message = lodash.isNil(action.confirm.description) ? action.confirm.message : {
                message: action.confirm.message,
                description: action.confirm.description
            };

            DialogsService.confirm(message, action.confirm.yesLabel, action.confirm.noLabel, action.confirm.type).then(function () {
                onFireAction(action.id);
            });
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [{
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('functions:DELETE_ITEM', { lng: lng }),
                    description: $i18next.t('functions:DELETE_DESCRIPTION', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'nuclio_alert'
                }
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclDeployLogController.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').component('nclDeployLog', {
        bindings: {
            logEntires: '<'
        },
        templateUrl: 'nuclio/common/components/deploy-log/deploy-log.tpl.html',
        controller: NclDeployLogController
    });

    function NclDeployLogController(lodash) {
        var ctrl = this;

        ctrl.scrollCofig = {
            advanced: {
                updateOnContentResize: true
            },
            theme: 'light-thin'
        };

        ctrl.getLogLevel = getLogLevel;
        ctrl.getLogParams = getLogParams;

        //
        // Public methods
        //

        /**
         * Get log level display value
         * @param {string} level - the level model value (one of: 'debug', 'info', 'warn', 'error')
         * @returns {string} the log level display value
         */
        function getLogLevel(level) {
            return lodash.first(level).toUpperCase();
        }

        /**
         * Get log parameters display value
         * @param {string} logEntry - the log entry that includes the parameters
         * @returns {string} the log level display value
         */
        function getLogParams(logEntry) {
            var params = lodash.omit(logEntry, ['name', 'time', 'level', 'message', 'err']);

            return lodash.isEmpty(params) ? '' : '[' + lodash.map(params, function (value, key) {
                return key + ': ' + angular.toJson(value);
            }).join(', ').replace(/\\n/g, '\n').replace(/\\"/g, '"') + ']';
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 110] */
(function () {
    'use strict';

    NclEditItemController.$inject = ['$document', '$element', '$rootScope', '$scope', '$timeout', '$i18next', 'i18next', 'lodash', 'ConverterService', 'FunctionsService', 'FormValidationService', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclEditItem', {
        bindings: {
            item: '<',
            type: '@',
            onSubmitCallback: '&',
            defaultFields: '<?'
        },
        templateUrl: 'nuclio/common/components/edit-item/edit-item.tpl.html',
        controller: NclEditItemController
    });

    function NclEditItemController($document, $element, $rootScope, $scope, $timeout, $i18next, i18next, lodash, ConverterService, FunctionsService, FormValidationService, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.classList = [];
        ctrl.editItemForm = {};
        ctrl.selectedClass = {};

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;

        ctrl.numberValidationPattern = /^\d+$/;
        ctrl.arrayIntValidationPattern = /^(\d+[-,]?)*\d$/;
        ctrl.arrayStrValidationPattern = /^.{1,128}$/;
        ctrl.intervalValidationPattern = /^\d+(ms|[smh])$/;
        ctrl.stringValidationPattern = /^.{1,128}$/;
        ctrl.subscriptionQoSValidationPattern = /^[0-2]$/;
        ctrl.placeholder = '';
        ctrl.tooltips = {
            secret: 'A <a class="link" target="_blank" ' + 'href="https://kubernetes.io/docs/concepts/configuration/secret/">' + $i18next.t('functions:TOOLTIP.SECRET.HEAD', { lng: lng }) + '</a> ' + $i18next.t('functions:TOOLTIP.SECRET.REST', { lng: lng }),
            configMap: 'A <a class="link" target="_blank" ' + 'href="https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/">' + $i18next.t('functions:TOOLTIP.CONFIG_MAP.HEAD', { lng: lng }) + '</a> ' + $i18next.t('functions:TOOLTIP.CONFIG_MAP.REST', { lng: lng }),
            v3io: $i18next.t('functions:TOOLTIP.V3IO', { lng: lng })
        };

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.addNewIngress = addNewIngress;
        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.addNewSubscription = addNewSubscription;
        ctrl.addNewTopic = addNewTopic;
        ctrl.addNewBroker = addNewBroker;
        ctrl.addNewEventHeader = addNewEventHeader;
        ctrl.convertFromCamelCase = convertFromCamelCase;
        ctrl.getAttrValue = getAttrValue;
        ctrl.getInputValue = getInputValue;
        ctrl.getTooltip = getTooltip;
        ctrl.getValidationPattern = getValidationPattern;
        ctrl.handleIngressAction = handleIngressAction;
        ctrl.handleAnnotationAction = handleAnnotationAction;
        ctrl.handleSubscriptionAction = handleSubscriptionAction;
        ctrl.handleTopicAction = handleTopicAction;
        ctrl.handleBrokerAction = handleBrokerAction;
        ctrl.handleEventHeaderAction = handleEventHeaderAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.isHttpTrigger = isHttpTrigger;
        ctrl.isKafkaTrigger = isKafkaTrigger;
        ctrl.isMQTTTrigger = isMQTTTrigger;
        ctrl.isCronTrigger = isCronTrigger;
        ctrl.isTooltipVisible = isTooltipVisible;
        ctrl.isTriggerType = isTriggerType;
        ctrl.isVolumeType = isVolumeType;
        ctrl.onChangeData = onChangeData;
        ctrl.onClearButtonClick = onClearButtonClick;
        ctrl.onSubmitForm = onSubmitForm;
        ctrl.onSelectClass = onSelectClass;
        ctrl.onSelectDropdownValue = onSelectDropdownValue;
        ctrl.numberInputCallback = numberInputCallback;
        ctrl.getPlaceholderText = getPlaceholderText;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        // eslint-disable-next-line
        function onInit() {
            ctrl.placeholder = getPlaceholder();

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);
            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.className = ctrl.selectedClass.name;

                $timeout(validateValues);
            }

            if (ctrl.isTriggerType()) {
                lodash.defaults(ctrl.item, {
                    workerAllocatorName: ''
                });
            }

            if (ctrl.isVolumeType()) {
                var selectedTypeName = !lodash.isNil(ctrl.item.volume.hostPath) ? 'hostPath' : !lodash.isNil(ctrl.item.volume.flexVolume) ? 'v3io' : !lodash.isNil(ctrl.item.volume.secret) ? 'secret' : !lodash.isNil(ctrl.item.volume.configMap) ? 'configMap' : !lodash.isNil(ctrl.item.volume.persistentVolumeClaim) ? 'persistentVolumeClaim' : null;

                if (!lodash.isNil(selectedTypeName)) {
                    ctrl.selectedClass = lodash.find(ctrl.classList, ['id', selectedTypeName]);
                }
            }

            if (ctrl.isTriggerType() && ctrl.isHttpTrigger()) {
                if (lodash.isNil(ctrl.item.workerAvailabilityTimeoutMilliseconds)) {
                    ctrl.item.workerAvailabilityTimeoutMilliseconds = 0;
                }

                ctrl.ingresses = lodash.chain(ctrl.item.attributes.ingresses).defaultTo([]).map(function (ingress) {
                    return {
                        name: ingress.host,
                        value: ingress.paths.join(','),
                        additionalValue: ingress.secretName,
                        ui: {
                            editModeActive: false,
                            isFormValid: true,
                            name: 'ingress'
                        }
                    };
                }).value();

                ctrl.annotations = lodash.chain(ctrl.item.annotations).defaultTo([]).map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: true,
                            name: 'trigger.annotation'
                        }
                    };
                }).value();
            }

            if (ctrl.isTriggerType() && ctrl.isKafkaTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    initialOffset: 'latest',
                    sasl: {
                        enable: false,
                        user: '',
                        password: ''
                    }
                });

                ctrl.topics = lodash.chain(ctrl.item.attributes.topics).defaultTo([]).map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: true,
                            name: 'topic'
                        }
                    };
                }).value();

                ctrl.brokers = lodash.chain(ctrl.item.attributes.brokers).defaultTo([]).map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: true,
                            name: 'broker'
                        }
                    };
                }).value();
            }

            if (ctrl.isTriggerType() && isV3ioTrigger()) {
                lodash.defaults(ctrl.item, {
                    username: '',
                    password: ''
                });
            }

            if (ctrl.isTriggerType() && ctrl.isMQTTTrigger()) {
                ctrl.subscriptions = lodash.chain(ctrl.item.attributes.subscriptions).defaultTo([]).map(function (value) {
                    return {
                        name: value.topic,
                        value: value.qos,
                        ui: {
                            editModeActive: false,
                            isFormValid: true,
                            name: 'subscription'
                        }
                    };
                }).value();
            }

            if (ctrl.isTriggerType() && ctrl.isCronTrigger()) {
                lodash.defaultsDeep(ctrl.item.attributes, {
                    event: {
                        body: '',
                        headers: {}
                    }
                });

                ctrl.eventHeaders = lodash.chain(lodash.get(ctrl.item, 'attributes.event.headers')).defaultTo([]).map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: true,
                            name: 'event.headers'
                        }
                    };
                }).value();
            }

            $scope.$on('deploy-function-version', onFunctionDeploy);
        }

        /**
         * Post linking method
         */
        function postLink() {
            $document.on('click', function (event) {
                if (!lodash.isNil(ctrl.editItemForm)) {
                    onSubmitForm(event);
                }
            });

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        /**
         * Destructor
         */
        function onDestroy() {
            $document.off('click', onSubmitForm);
        }

        //
        // Public methods
        //

        /**
         * Converts attribute names in class list from camel case
         * @param {string} str - string which must be converted
         */
        function convertFromCamelCase(str) {
            return str.replace(/([a-z])([A-Z])/g, '$1 $2');
        }

        /**
         * Adds new ingress
         */
        function addNewIngress(event) {
            $timeout(function () {
                if (ctrl.ingresses.length < 1 || lodash.chain(ctrl.ingresses).last().get('ui.isFormValid', true).value()) {
                    ctrl.ingresses.push({
                        name: lodash.get(ctrl.defaultFields, 'ingressHost', ''),
                        value: '/',
                        additionalValue: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'ingress'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new annotation
         */
        function addNewAnnotation(event) {
            $timeout(function () {
                if (ctrl.annotations.length < 1 || lodash.last(ctrl.annotations).ui.isFormValid) {
                    ctrl.annotations.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'trigger.annotation'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new subscription
         */
        function addNewSubscription(event) {
            $timeout(function () {
                if (ctrl.subscriptions.length < 1 || lodash.last(ctrl.subscriptions).ui.isFormValid) {
                    ctrl.subscriptions.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'subscription'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new topic
         */
        function addNewTopic(event) {
            $timeout(function () {
                if (ctrl.topics.length < 1 || lodash.last(ctrl.topics).ui.isFormValid) {
                    ctrl.topics.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'topic'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new broker
         */
        function addNewBroker(event) {
            $timeout(function () {
                if (ctrl.brokers.length < 1 || lodash.last(ctrl.brokers).ui.isFormValid) {
                    ctrl.brokers.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'broker'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Adds new event header
         * @param {Object} event - native event object
         */
        function addNewEventHeader(event) {
            $timeout(function () {
                if (ctrl.eventHeaders.length < 1 || lodash.last(ctrl.eventHeaders).ui.isFormValid) {
                    ctrl.eventHeaders.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'event.headers'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Checks validation of function`s variables
         */
        function checkValidation(variableName) {
            lodash.forEach(ctrl[variableName], function (variable) {
                if (!variable.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: variable.ui.name, isDisabled: true });
                }
            });
        }

        /**
         * Returns the value of an attribute
         * @param {string} attrName
         * @returns {string}
         */
        function getAttrValue(attrName) {
            return lodash.get(ctrl.item, 'attributes.' + attrName);
        }

        /**
         * Returns value for Name input.
         * Value could has different path depends on item type.
         * @returns {string}
         */
        function getInputValue() {
            return ctrl.type === 'volume' ? ctrl.item.volume.name : ctrl.item.name;
        }

        /**
         * Gets corresponding tooltip description
         * @returns {string}
         */
        function getTooltip() {
            return lodash.get(ctrl.tooltips, ctrl.selectedClass.id, '');
        }

        /**
         * Gets validation patterns depends on type of attribute
         * @param {string} pattern
         * @returns {RegExp}
         */
        function getValidationPattern(pattern) {
            return lodash.get(ctrl, pattern + 'ValidationPattern', ctrl.stringValidationPattern);
        }

        /**
         * Handler on specific action type of trigger's ingress
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleIngressAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.ingresses.splice(index, 1);
                lodash.unset(ctrl.item, 'attributes.ingresses.' + index);

                checkValidation('ingresses');
            }
        }

        /**
         * Handler on specific action type of trigger's event header
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleEventHeaderAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.eventHeaders.splice(index, 1);
                lodash.unset(ctrl.item, 'attributes.event.headers.' + index);

                checkValidation('eventHeaders');
            }
        }

        /**
         * Handler on specific action type of trigger's annotation
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleAnnotationAction(actionType, index) {
            if (actionType === 'delete') {
                var deletedItems = ctrl.annotations.splice(index, 1);
                lodash.unset(ctrl.item, 'annotations.' + lodash.head(deletedItems).name);

                checkValidation('annotations');
            }
        }

        /**
         * Handler on specific action type of trigger's subscription
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleSubscriptionAction(actionType, index) {
            if (actionType === 'delete') {
                lodash.pullAt(ctrl.subscriptions, index);
                lodash.pullAt(ctrl.item.attributes.subscriptions, index);

                checkValidation('subscriptions');
            }
        }

        /**
         * Handler on specific action type of trigger's topic
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleTopicAction(actionType, index) {
            if (actionType === 'delete') {
                lodash.pullAt(ctrl.topics, index);
                lodash.pullAt(ctrl.item.attributes.topics, index);

                checkValidation('topics');
            }
        }

        /**
         * Handler on specific action type of trigger's broker
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleBrokerAction(actionType, index) {
            if (actionType === 'delete') {
                lodash.pullAt(ctrl.brokers, index);
                lodash.pullAt(ctrl.item.attributes.brokers, index);

                checkValidation('brokers');
            }
        }

        /**
         * Determine whether the item class was selected
         * @returns {boolean}
         */
        function isClassSelected() {
            return !lodash.isEmpty(ctrl.selectedClass);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (ctrl.isVolumeType() && field === 'name') {
                lodash.set(ctrl.item, 'volumeMount.name', newData);
                lodash.set(ctrl.item, 'volume.name', newData);
            } else {
                lodash.set(ctrl.item, field, newData);
            }

            validateValues();
        }

        /**
         * Checks for `http` triggers
         * @returns {boolean}
         */
        function isHttpTrigger() {
            return ctrl.selectedClass.id === 'http';
        }

        /**
         * Checks for `kafka` triggers
         * @returns {boolean}
         */
        function isKafkaTrigger() {
            return ctrl.selectedClass.id === 'kafka-cluster';
        }

        /**
         * Checks for `cron` triggers
         * @returns {boolean}
         */
        function isCronTrigger() {
            return ctrl.selectedClass.id === 'cron';
        }

        /**
         * Checks if tooltip is visible.
         * @returns {boolean}
         */
        function isTooltipVisible() {
            return lodash.includes(lodash.keys(ctrl.tooltips), ctrl.selectedClass.id);
        }

        /**
         * Returns `true` if item is a trigger.
         * @returns {boolean} `true` if item is a trigger, or `false` otherwise.
         */
        function isTriggerType() {
            return ctrl.type === 'trigger';
        }

        /**
         * Checks is input have to be visible for specific item type
         * @returns {boolean}
         */
        function isVolumeType() {
            return ctrl.type === 'volume';
        }

        /**
         * Checks for `mqtt` triggers
         * @returns {boolean}
         */
        function isMQTTTrigger() {
            return ctrl.selectedClass.id === 'mqtt';
        }

        /**
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeData(variable, index) {
            if (variable.ui.name === 'trigger.annotation') {
                ctrl.annotations[index] = variable;

                checkValidation('annotations');
            } else if (variable.ui.name === 'ingress') {
                ctrl.ingresses[index] = variable;

                checkValidation('ingresses');
            } else if (variable.ui.name === 'event.headers') {
                ctrl.eventHeaders[index] = variable;

                checkValidation('eventHeaders');
            } else if (variable.ui.name === 'subscription') {
                ctrl.subscriptions[index] = variable;

                checkValidation('subscriptions');
            } else if (variable.ui.name === 'topic') {
                ctrl.topics[index] = variable;

                checkValidation('topics');
            } else if (variable.ui.name === 'broker') {
                ctrl.brokers[index] = variable;

                checkValidation('brokers');
            }
        }

        /**
         * Set empty string to `schedule` field of `cron` trigger
         */
        function onClearButtonClick() {
            lodash.set(ctrl.item, 'attributes.schedule', '');

            $timeout(function () {
                validateValues();
            });
        }

        /**
         * Update item class callback
         * @param {Object} item - item class/kind
         */
        // eslint-disable-next-line
        function onSelectClass(item) {
            ctrl.selectedClass = item;

            if (ctrl.isVolumeType()) {
                lodash.defaultsDeep(ctrl.item, {
                    volume: {
                        name: ''
                    },
                    volumeMount: {
                        name: '',
                        mountPath: ''
                    }
                });

                if (item.id === 'hostPath') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        hostPath: {
                            path: ''
                        }
                    });

                    cleanOtherVolumeClasses('hostPath');
                } else if (item.id === 'v3io') {
                    // see https://github.com/v3io/flex-fuse
                    lodash.defaultsDeep(ctrl.item, {
                        volume: {
                            flexVolume: {
                                driver: 'v3io/fuse',
                                options: {
                                    accessKey: '',
                                    container: '',
                                    subPath: ''
                                }
                            }
                        }
                    });

                    cleanOtherVolumeClasses('flexVolume');
                } else if (item.id === 'secret') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        secret: {
                            secretName: ''
                        }
                    });

                    cleanOtherVolumeClasses('secret');
                } else if (item.id === 'configMap') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        configMap: {
                            name: ''
                        }
                    });

                    cleanOtherVolumeClasses('configMap');
                } else if (item.id === 'persistentVolumeClaim') {
                    lodash.defaultsDeep(ctrl.item.volume, {
                        persistentVolumeClaim: {
                            claimName: ''
                        }
                    });

                    cleanOtherVolumeClasses('persistentVolumeClaim');
                }

                return;
            }

            ctrl.item = lodash.omit(ctrl.item, ['maxWorkers', 'url', 'secret', 'annotations', 'workerAvailabilityTimeoutMilliseconds', 'username', 'password', 'workerAllocatorName']);

            var nameDirty = ctrl.editItemForm.itemName.$dirty;
            var nameInvalid = ctrl.editItemForm.itemName.$invalid;

            ctrl.item.kind = item.id;
            ctrl.item.attributes = {};
            ctrl.item.ui.className = ctrl.selectedClass.name;

            if (!lodash.isNil(item.url)) {
                ctrl.item.url = '';
            }

            if (!lodash.isNil(item.maxWorkers)) {
                ctrl.item.maxWorkers = '';
            }

            if (!lodash.isNil(item.secret)) {
                ctrl.item.secret = '';
            }

            if (!lodash.isNil(item.annotations)) {
                ctrl.annotations = [];
            }

            if (!lodash.isNil(item.workerAvailabilityTimeoutMilliseconds)) {
                ctrl.item.workerAvailabilityTimeoutMilliseconds = item.workerAvailabilityTimeoutMilliseconds.defaultValue;
            }

            if (!lodash.isNil(item.username)) {
                ctrl.item.username = '';
            }

            if (!lodash.isNil(item.password)) {
                ctrl.item.password = '';
            }

            if (!lodash.isNil(item.workerAvailabilityTimeoutMilliseconds)) {
                ctrl.item.workerAvailabilityTimeoutMilliseconds = item.workerAvailabilityTimeoutMilliseconds.defaultValue;
            }

            lodash.each(item.attributes, function (attribute) {
                if (attribute.name === 'ingresses') {
                    ctrl.ingresses = [];
                } else if (attribute.name === 'sasl') {
                    ctrl.item.attributes.sasl = {};

                    lodash.forEach(attribute.values, function (value, key) {
                        lodash.set(ctrl.item.attributes, ['sasl', key], value.defaultValue);
                    });
                } else if (attribute.name === 'event') {
                    ctrl.eventHeaders = [];
                    ctrl.item.attributes.event = {};

                    lodash.forEach(attribute.values, function (value, key) {
                        lodash.set(ctrl.item.attributes, ['event', key], value.defaultValue);
                    });
                } else if (attribute.name === 'subscriptions') {
                    ctrl.subscriptions = [];
                } else if (attribute.name === 'kafka-topics') {
                    ctrl.topics = [];
                } else if (attribute.name === 'kafka-brokers') {
                    ctrl.brokers = [];
                } else {
                    lodash.set(ctrl.item.attributes, attribute.name, lodash.get(attribute, 'defaultValue', ''));
                }
            });

            // set form pristine to not validate new form fields
            ctrl.editItemForm.$setPristine();

            // if itemName is invalid - set it dirty to show validation message
            if (nameDirty && nameInvalid) {
                ctrl.editItemForm.itemName.$setDirty();
            }
        }

        /**
         * Removes volume classes except `selectedClass`
         * @param {string} selectedClass
         */
        function cleanOtherVolumeClasses(selectedClass) {
            var removeVolume = lodash.unset.bind(null, ctrl.item.volume);

            lodash.chain(['hostPath', 'flexVolume', 'secret', 'configMap', 'persistentVolumeClaim']).without(selectedClass).forEach(removeVolume).value();
        }

        /**
         * Sets new selected value from dropdown
         * @param {Object} item
         * @param {string} field
         */
        function onSelectDropdownValue(item, field) {
            lodash.set(ctrl.item, field, item.id);
        }

        /**
         * Changes value from number input
         * @param {number} item
         * @param {string} field
         */
        function numberInputCallback(item, field) {
            lodash.set(ctrl.item, field, item);
        }

        /**
         * On submit form handler
         * Hides the item create/edit mode
         * @param {MouseEvent} event
         */
        function onSubmitForm(event) {
            ctrl.item.ui.expandable = !ctrl.editItemForm.$invalid;

            if (angular.isUndefined(event.keyCode) || event.keyCode === 13) {
                if (event.target !== $element[0] && $element.find(event.target).length === 0 && (ctrl.isVolumeType() || areElementsValidOnSubmit(event))) {
                    if (ctrl.editItemForm.$invalid) {
                        ctrl.item.ui.isFormValid = false;

                        $rootScope.$broadcast('change-state-deploy-button', {
                            component: ctrl.item.ui.name,
                            isDisabled: true
                        });

                        ctrl.editItemForm.itemName.$setDirty();

                        // set form as submitted
                        ctrl.editItemForm.$setSubmitted();
                    } else {
                        $timeout(function () {
                            ctrl.item.ui.isFormValid = true;

                            if (!lodash.includes(lodash.get(event.target, 'parentElement.classList'), 'row-collapse')) {
                                ctrl.item.ui.editModeActive = false;
                            }

                            lodash.forEach(ctrl.selectedClass.attributes, function (attribute) {
                                if (attribute.pattern === 'number') {
                                    var emptyValue = lodash.isNil(ctrl.item.attributes[attribute.name]) || ctrl.item.attributes[attribute.name] === '';
                                    var numberAttribute = attribute.allowEmpty && emptyValue ? '' : Number(ctrl.item.attributes[attribute.name]);

                                    lodash.set(ctrl.item, 'attributes[' + attribute.name + ']', numberAttribute);
                                }

                                if (attribute.pattern === 'arrayStr') {
                                    lodash.update(ctrl.item.attributes, attribute.name, ConverterService.toStringArray);
                                }

                                if (attribute.pattern === 'arrayInt' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                    ctrl.item.attributes[attribute.name] = ConverterService.toNumberArray(ctrl.item.attributes[attribute.name]);
                                }

                                if (attribute.name === 'ingresses') {
                                    var newIngresses = {};

                                    lodash.forEach(ctrl.ingresses, function (ingress, key) {
                                        newIngresses[key.toString()] = {
                                            paths: ingress.value.split(',')
                                        };

                                        if (!lodash.isEmpty(ingress.name)) {
                                            newIngresses[key.toString()].host = ingress.name;
                                        }

                                        if (!lodash.isEmpty(ingress.additionalValue)) {
                                            newIngresses[key.toString()].secretName = ingress.additionalValue;
                                        }
                                    });

                                    ctrl.item.attributes[attribute.name] = newIngresses;
                                }

                                if (attribute.name === 'event') {
                                    var newEventHeader = {};

                                    lodash.forEach(ctrl.eventHeaders, function (headers) {
                                        newEventHeader[headers.name] = headers.value;
                                    });

                                    lodash.set(ctrl.item, 'attributes.event.headers', newEventHeader);
                                }
                            });

                            if (ctrl.isHttpTrigger()) {
                                updateAnnotaions();
                            }

                            if (ctrl.isMQTTTrigger()) {
                                updateSubscriptions();
                            }

                            if (ctrl.isKafkaTrigger()) {
                                updateTopics();
                                updateBrokers();
                            }

                            $rootScope.$broadcast('change-state-deploy-button', {
                                component: ctrl.item.ui.name,
                                isDisabled: false
                            });

                            ctrl.onSubmitCallback({ item: ctrl.item });
                        });
                    }
                }
            }
        }

        /**
         * Updates annotations fields
         */
        function updateAnnotaions() {
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (label) {
                newAnnotations[label.name] = label.value;
            });

            lodash.set(ctrl.item, 'annotations', newAnnotations);
        }

        /**
         * Updates subscriptions fields
         */
        function updateSubscriptions() {
            var newSubscriptions = lodash.map(ctrl.subscriptions, function (subscription) {
                return {
                    topic: subscription.name,
                    qos: Number(subscription.value)
                };
            });

            lodash.set(ctrl.item, 'attributes.subscriptions', newSubscriptions);
        }

        /**
         * Updates topics fields
         */
        function updateTopics() {
            var newTopics = lodash.map(ctrl.topics, function (topic) {
                return topic.value;
            });

            lodash.set(ctrl.item, 'attributes.topics', newTopics);
        }

        /**
         * Updates Brokers fields
         */
        function updateBrokers() {
            var newBrokers = lodash.map(ctrl.brokers, function (broker) {
                return broker.value;
            });

            lodash.set(ctrl.item, 'attributes.brokers', newBrokers);
        }

        /**
         * Return placeholder text for input
         * @param {Object} attribute
         */
        function getPlaceholderText(attribute) {
            var defaultPlaceholder = 'Enter ' + ctrl.convertFromCamelCase(attribute.name).toLowerCase() + '...';
            return lodash.defaultTo(attribute.placeholder, defaultPlaceholder);
        }

        //
        // Private methods
        //

        /**
         * Checks if click wasn't on one of the elements from the list
         * @param {Event} event - JS event object
         * @returns {boolean} Returns `true` if click wasn't on one of elements from the list
         */
        function areElementsValidOnSubmit(event) {
            var elementsForValidation = ['ncl-edit-item', '.actions-menu', '.single-action', '.ngdialog', '.mCustomScrollBox'];

            return lodash.every(elementsForValidation, function (element) {
                if (element === '.mCustomScrollBox' && event.target.closest('.row-collapse')) {
                    return true;
                }
                return !event.target.closest(element);
            });
        }

        /**
         * Returns placeholder value depends on incoming component type
         * @returns {string}
         */
        function getPlaceholder() {
            var placeholders = {
                volume: $i18next.t('functions:PLACEHOLDER.SELECT_TYPE', { lng: lng }),
                default: $i18next.t('functions:PLACEHOLDER.SELECT_CLASS', { lng: lng })
            };

            return lodash.get(placeholders, ctrl.type, placeholders.default);
        }

        /**
         * Checks for V3IO triggers
         * @returns {boolean}
         */
        function isV3ioTrigger() {
            return ctrl.selectedClass.id === 'v3ioStream';
        }

        /**
         * Broadcast's callback to deploy function
         * @param {Event} event - native broadcast event object
         * @param {Object} data - broadcast data with event object
         */
        function onFunctionDeploy(event, data) {
            ctrl.onSubmitForm(data.event);
        }

        /**
         * Validate interval and schedule fields
         */
        function validateValues() {
            if (ctrl.item.kind === 'cron') {
                var scheduleAttribute = lodash.find(ctrl.selectedClass.attributes, { name: 'schedule' });
                var intervalAttribute = lodash.find(ctrl.selectedClass.attributes, { name: 'interval' });
                var intervalInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_interval.$viewValue);
                var scheduleInputIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_schedule.$viewValue);

                if (intervalInputIsFilled === scheduleInputIsFilled) {

                    // if interval and schedule fields are filled or they are empty - makes these fields invalid
                    ctrl.editItemForm.item_interval.$setValidity('text', false);
                    ctrl.editItemForm.item_schedule.$setValidity('text', false);
                } else {

                    // if interval or schedule filed is filled - makes these fields valid
                    ctrl.editItemForm.item_interval.$setValidity('text', true);
                    ctrl.editItemForm.item_schedule.$setValidity('text', true);
                    scheduleAttribute.allowEmpty = intervalInputIsFilled;
                    intervalAttribute.allowEmpty = scheduleInputIsFilled;
                }
            } else if (ctrl.item.kind === 'rabbit-mq') {
                var queueName = lodash.find(ctrl.selectedClass.attributes, { name: 'queueName' });
                var topics = lodash.find(ctrl.selectedClass.attributes, { name: 'topics' });
                var queueNameIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_queueName.$viewValue);
                var topicsIsFilled = !lodash.isEmpty(ctrl.editItemForm.item_topics.$viewValue);

                // Queue Name and Topics cannot be both empty at the same time
                // at least one of them should be filled
                // if one of them is filled, the other is allowed to be empty
                queueName.allowEmpty = topicsIsFilled;
                topics.allowEmpty = queueNameIsFilled;

                // update validity: if empty is not allowed and value is currently empty - mark invalid, otherwise valid
                ctrl.editItemForm.item_queueName.$setValidity('text', queueName.allowEmpty || queueNameIsFilled);
                ctrl.editItemForm.item_topics.$setValidity('text', topics.allowEmpty || topicsIsFilled);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclFunctionConfigDialogController.$inject = ['DialogsService', 'ExportService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionConfigDialog', {
        bindings: {
            closeDialog: '&',
            function: '<'
        },
        templateUrl: 'nuclio/common/components/function-config-dialog/function-config-dialog.tpl.html',
        controller: NclFunctionConfigDialogController
    });

    function NclFunctionConfigDialogController(DialogsService, ExportService) {
        var ctrl = this;

        ctrl.editorTheme = {
            id: 'vs',
            name: 'Light',
            visible: true
        };

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.title = ctrl.function.metadata.name + ' - configuration';
            ctrl.sourceCode = ExportService.getFunctionConfig(ctrl.function);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclKeyValueInputController.$inject = ['$document', '$element', '$rootScope', '$scope', '$timeout', '$i18next', 'i18next', 'lodash', 'DialogsService', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclKeyValueInput', {
        bindings: {
            actionHandlerCallback: '&',
            changeDataCallback: '&',
            dropdownOverlap: '<?',
            itemIndex: '<',
            rowData: '<',
            useType: '<',
            useLabels: '<',
            allValueTypes: '<',
            allowSelection: '<?',
            changeStateBroadcast: '@?',
            keyOptional: '<?',
            keyValidationPattern: '<?',
            keyPlaceholder: '@?',
            valueOptional: '<?',
            valueValidationPattern: '<?',
            valuePlaceholder: '@?',
            listClass: '@?',
            submitOnFly: '<?',
            onlyValueInput: '<?',
            useAdditionalValue: '<?',
            additionalValueOptional: '<?'
        },
        templateUrl: 'nuclio/common/components/key-value-input/key-value-input.tpl.html',
        controller: NclKeyValueInputController
    });

    function NclKeyValueInputController($document, $element, $rootScope, $scope, $timeout, $i18next, i18next, lodash, DialogsService, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.data = {};
        ctrl.typesList = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.closeDropdown = closeDropdown;
        ctrl.onEditInput = onEditInput;
        ctrl.getInputValue = getInputValue;
        ctrl.getInputKey = getInputKey;
        ctrl.getType = getType;
        ctrl.isVisibleByType = isVisibleByType;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.inputKeyCallback = inputKeyCallback;
        ctrl.onClickAction = onClickAction;
        ctrl.onFireAction = onFireAction;
        ctrl.openDropdown = openDropdown;
        ctrl.onTypeChanged = onTypeChanged;
        ctrl.showDotMenu = showDotMenu;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.actions = initActions();
            ctrl.data = lodash.cloneDeep(ctrl.rowData);
            ctrl.editMode = lodash.get(ctrl.data, 'ui.editModeActive', false);
            ctrl.typesList = getTypesList();

            lodash.defaults(ctrl, {
                allowSelection: false,
                dropdownOverlap: false,
                keyOptional: false,
                keyPlaceholder: $i18next.t('functions:PLACEHOLDER.ENTER_KEY', { lng: lng }),
                onlyValueInput: false,
                submitOnFly: false,
                useAdditionalValue: false,
                valuePlaceholder: $i18next.t('functions:PLACEHOLDER.ENTER_VALUE', { lng: lng })
            });

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);

            $scope.$on('action-checkbox_item-checked', function () {
                if (angular.isFunction(ctrl.changeDataCallback)) {
                    ctrl.changeDataCallback({ newData: ctrl.data, index: ctrl.itemIndex });
                }
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', saveChanges);
            $document.off('keypress', saveChanges);

            if (angular.isDefined(ctrl.changeStateBroadcast)) {
                $rootScope.$broadcast(ctrl.changeStateBroadcast, { component: ctrl.data.ui.name, isDisabled: ctrl.keyValueInputForm.$invalid });
            }
        }

        //
        // Public methods
        //

        /**
         * Gets model for value input
         * @returns {string}
         */
        function getInputValue() {
            if (ctrl.useType) {
                var specificType = ctrl.getType() === 'value' ? 'value' : ctrl.getType() === 'configmap' ? 'valueFrom.configMapKeyRef' : 'valueFrom.secretKeyRef';
                var value = lodash.get(ctrl.data, specificType);

                return specificType === 'value' ? value : value.name;
            } else {
                return ctrl.data.value;
            }
        }

        /**
         * Gets model for value-key input
         * @returns {string}
         */
        function getInputKey() {
            if (ctrl.useType && ctrl.getType() !== 'value') {
                var specificType = ctrl.getType() === 'configmap' ? 'valueFrom.configMapKeyRef' : 'valueFrom.secretKeyRef';
                var value = lodash.get(ctrl.data, specificType);

                return value.key;
            } else {
                return null;
            }
        }

        /**
         * Gets selected type
         * @returns {string}
         */
        function getType() {
            return !ctrl.useType || lodash.isNil(ctrl.data.valueFrom) ? 'value' : lodash.isNil(ctrl.data.valueFrom.secretKeyRef) ? 'configmap' : 'secret';
        }

        /**
         * Check whether the block visibility match the given type
         * @param {string} type
         * @returns {boolean}
         */
        function isVisibleByType(type) {
            return type === ctrl.getType();
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (lodash.includes(field, 'value') && ctrl.getType() !== 'value') {

                lodash.assign(lodash.get(ctrl.data, getValueField()), {
                    name: newData
                });
            } else {
                ctrl.data[field] = newData;
            }

            if (ctrl.submitOnFly) {
                saveChanges();
            }
        }

        /**
         * Update data callback
         * @param {string} newData
         */
        function inputKeyCallback(newData) {
            lodash.assign(lodash.get(ctrl.data, getValueField()), {
                key: newData
            });

            if (ctrl.submitOnFly) {
                saveChanges();
            }
        }

        /**
         * Handler on action click
         * @param {Object} action - action that was clicked (e.g. `delete`)
         */
        function onClickAction(action) {
            if (lodash.isNonEmpty(action.confirm)) {
                showConfirmDialog(action);
            } else {
                onFireAction(action.id);
            }
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, index: ctrl.itemIndex });
            ctrl.editMode = false;
        }

        /**
         * Callback method which handles field type changing
         * @param {Object} newType - type selected in dropdown
         * @param {boolean} isItemChanged - shows whether item was changed
         */
        function onTypeChanged(newType, isItemChanged) {
            if (isItemChanged) {
                if (newType.id === 'secret' || newType.id === 'configmap') {
                    var specificType = newType.id === 'secret' ? 'secretKeyRef' : 'configMapKeyRef';
                    var value = {
                        name: ''
                    };

                    ctrl.data = lodash.omit(ctrl.data, ['value', 'valueFrom']);
                    lodash.set(ctrl.data, 'valueFrom.' + specificType, value);

                    $rootScope.$broadcast('key-value-type-changed', false);
                } else {
                    ctrl.data = lodash.omit(ctrl.data, 'valueFrom');
                    lodash.set(ctrl.data, 'value', '');
                }

                if (ctrl.submitOnFly) {
                    saveChanges();
                }
            }
        }

        /**
         * On open default dropdown
         */
        function openDropdown() {
            $timeout(function () {
                var parent = angular.element(document).find('.' + ctrl.listClass)[0];
                var dropdown = angular.element(document).find('.' + ctrl.listClass + ' .default-dropdown-container')[0];
                var parentRect = parent.getBoundingClientRect();
                var dropdownRect = dropdown.getBoundingClientRect();

                parent = angular.element(parent);

                if (dropdownRect.bottom > parentRect.bottom) {
                    parent.css({ 'padding-bottom': dropdownRect.bottom - parentRect.bottom + 'px' });
                }
            });
        }

        /**
         * On close default dropdown
         */
        function closeDropdown() {
            var parent = angular.element(angular.element(document).find('.' + ctrl.listClass)[0]);
            parent.css({ 'padding-bottom': '0px' });
        }

        /**
         * Enables edit mode
         */
        function onEditInput() {
            ctrl.editMode = true;

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
        }

        /**
         * Checks if show dot menu
         */
        function showDotMenu() {
            return ctrl.actions.length > 1;
        }

        //
        // Private method
        //

        /**
         * Shows confirm dialog
         * @param {Object} action - e.g. `delele`
         */
        function showConfirmDialog(action) {
            var message = lodash.isNil(action.confirm.description) ? action.confirm.message : {
                message: action.confirm.message,
                description: action.confirm.description
            };

            DialogsService.confirm(message, action.confirm.yesLabel, action.confirm.noLabel, action.confirm.type).then(function () {
                onFireAction(action.id);
            });
        }

        /**
         * Gets types list
         * @returns {Array.<Object>}
         */
        function getTypesList() {
            return [{
                id: 'value',
                name: $i18next.t('common:VALUE', { lng: lng })
            }, {
                id: 'secret',
                name: $i18next.t('functions:SECRET', { lng: lng })
            }, {
                id: 'configmap',
                name: $i18next.t('functions:CONFIGMAP', { lng: lng })
            }];
        }

        /**
         * Gets field which should be setted from value input
         * @returns {string}
         */
        function getValueField() {
            return !ctrl.useType || ctrl.getType() === 'value' ? 'value' : ctrl.getType() === 'configmap' ? 'valueFrom.configMapKeyRef' : 'valueFrom.secretKeyRef';
        }

        /**
         * Gets actions
         * @returns {Array.<Object>}
         */
        function initActions() {
            return [{
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('common:DELETE_SELECTED_ITEM_CONFIRM', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'critical_alert'
                }
            }];
        }

        /**
         * Calls callback with new data
         * @param {Event} [event]
         */
        function saveChanges(event) {
            if (angular.isUndefined(event) || $element.find(event.target).length === 0 || event.keyCode === EventHelperService.ENTER) {
                $scope.$evalAsync(function () {
                    ctrl.keyValueInputForm.$submitted = true;

                    if (ctrl.keyValueInputForm.$valid) {
                        ctrl.data.ui = {
                            editModeActive: false,
                            isFormValid: true,
                            name: ctrl.data.ui.name,
                            checked: ctrl.data.ui.checked
                        };

                        if (angular.isDefined(ctrl.changeStateBroadcast)) {
                            $rootScope.$broadcast(ctrl.changeStateBroadcast, {
                                component: ctrl.data.ui.name,
                                isDisabled: false
                            });
                        }

                        ctrl.editMode = false;

                        $document.off('click', saveChanges);
                        $document.off('keypress', saveChanges);
                    } else {
                        ctrl.data.ui = {
                            editModeActive: true,
                            isFormValid: false,
                            name: ctrl.data.ui.name,
                            checked: ctrl.data.ui.checked
                        };

                        if (angular.isDefined(ctrl.changeStateBroadcast)) {
                            $rootScope.$broadcast(ctrl.changeStateBroadcast, {
                                component: ctrl.data.ui.name,
                                isDisabled: true
                            });
                        }
                    }

                    ctrl.changeDataCallback({ newData: ctrl.data, index: ctrl.itemIndex });
                });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclMonacoController.$inject = ['$scope', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('nclMonaco', {
        bindings: {
            language: '<',
            functionSourceCode: '<',
            onChangeSourceCodeCallback: '&',
            selectedTheme: '<',
            miniMonaco: '<?',
            noTopPadding: '<?',
            showLineNumbers: '<?',
            showTextSizeDropdown: '<?',
            readOnly: '<?',
            wordWrap: '<?',
            name: '@?'
        },
        templateUrl: 'nuclio/common/components/monaco/monaco.tpl.html',
        controller: NclMonacoController
    });

    function NclMonacoController($scope, lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.onCodeChange = onCodeChange;
        ctrl.onTextSizeChange = onTextSizeChange;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.noTopPadding = lodash.defaultTo(ctrl.noTopPadding, ctrl.showTextSizeDropdown);

            $scope.selectedCodeFile = {
                code: ctrl.functionSourceCode
            };

            $scope.selectedFileLanguage = {
                language: ctrl.language
            };
        }

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.language) && !changes.language.isFirstChange()) {
                $scope.selectedCodeFile = {
                    code: $scope.selectedCodeFile.code
                };

                $scope.selectedFileLanguage = {
                    language: changes.language.currentValue
                };
            }

            if (angular.isDefined(changes.functionSourceCode) && !changes.functionSourceCode.isFirstChange()) {
                $scope.selectedCodeFile = {
                    code: changes.functionSourceCode.currentValue
                };
            }
        }

        /**
         * On code change callback.
         * igz-monaco-editor directive calls this callback with new changed content
         * @param {string} newCode - changed code
         */
        function onCodeChange(newCode) {
            if (angular.isFunction(ctrl.onChangeSourceCodeCallback)) {
                ctrl.onChangeSourceCodeCallback({
                    sourceCode: newCode,
                    language: $scope.selectedCodeFile.language
                });
            }
        }

        /**
         * On text size dropdown change
         * @param {string} newTextSize
         */
        function onTextSizeChange(newTextSize) {
            if (!lodash.isNil(newTextSize)) {
                ctrl.selectedTextSize = newTextSize;
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclNavigationTabsController.$inject = ['$rootScope', '$state', '$timeout', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('nclNavigationTabs', {
        bindings: {
            tabItems: '<'
        },
        templateUrl: 'nuclio/common/components/navigation-tabs/navigation-tabs.tpl.html',
        controller: NclNavigationTabsController
    });

    function NclNavigationTabsController($rootScope, $state, $timeout, lodash) {
        var ctrl = this;
        var isTestPaneToggled = true;

        ctrl.isTestPaneClosed = false;
        ctrl.isFunctionBuilding = isFunctionBuilding;
        ctrl.isToggleButtonVisible = isToggleButtonVisible;
        ctrl.toggleTestPane = toggleTestPane;

        //
        // Public methods
        //

        /**
         * Checks if it's 'building' state.
         * @param {string} status - current status
         * @returns {boolean}
         */
        function isFunctionBuilding(status) {
            return !lodash.includes(['ready', 'error', 'not yet deployed'], status);
        }

        /**
         * Checks if 'toggle test pane' button should be visible.
         * It should, only when 'code' tab is reached.
         * @returns {boolean}
         */
        function isToggleButtonVisible() {
            var isButtonVisible = lodash.get($state.$current, 'self.url', null) === '/code';

            if (!isButtonVisible) {
                ctrl.isTestPaneClosed = false;

                $rootScope.$broadcast('navigation-tabs_toggle-test-pane', { closeTestPane: ctrl.isTestPaneClosed });
            }

            return isButtonVisible;
        }

        /**
         * Sends broadcast to toggle test pane.
         */
        function toggleTestPane() {
            if (isTestPaneToggled) {
                ctrl.isTestPaneClosed = !ctrl.isTestPaneClosed;
                isTestPaneToggled = false;

                $rootScope.$broadcast('navigation-tabs_toggle-test-pane', { closeTestPane: ctrl.isTestPaneClosed });

                // wait until toggling animation will be completed
                $timeout(function () {
                    isTestPaneToggled = true;
                }, 600);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NavigationTabsService.$inject = ['$i18next', 'i18next', 'lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').factory('NavigationTabsService', NavigationTabsService);

    function NavigationTabsService($i18next, i18next, lodash, ConfigService) {
        return {
            getNavigationTabsConfig: getNavigationTabsConfig
        };

        //
        // Public methods
        //

        /**
         * Returns navigation tabs config depending on current state
         * @param {string} state
         * @returns {Array}
         */
        function getNavigationTabsConfig(state) {
            var navigationTabsConfigs = {
                'app.container': getContainersConfig(),
                'app.cluster': getClustersConfig(),
                'app.events': getEventsConfig(),
                'app.storage-pool': getStoragePoolsConfig(),
                'app.identity': getIdentityConfig(),
                'app.control-panel': getControlPanelConfig()
            };
            var stateTest = state.match(/^[^.]*.[^.]*/);

            return lodash.get(navigationTabsConfigs, stateTest[0], []);
        }

        //
        // Private methods
        //

        /**
         * Returns containers navigation tabs config
         * @returns {Array.<Object>}
         */
        function getContainersConfig() {
            var lng = i18next.language;

            var config = [{
                tabName: $i18next.t('common:OVERVIEW', { lng: lng }),
                id: 'overview',
                uiRoute: 'app.container.overview',
                capability: 'containers.overview'
            }, {
                tabName: $i18next.t('common:BROWSE', { lng: lng }),
                id: 'browse',
                uiRoute: 'app.container.browser',
                capability: 'containers.browse'
            }, {
                tabName: $i18next.t('common:DATA_ACCESS_POLICY', { lng: lng }),
                id: 'dataAccessPolicy',
                uiRoute: 'app.container.data-access-policy',
                capability: 'containers.dataPolicy'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: $i18next.t('common:DATA_LIFECYCLE', { lng: lng }),
                    id: 'dataLifecycle',
                    uiRoute: 'app.container.data-lifecycle',
                    capability: 'containers.dataLifecycle'
                });
            }

            if (ConfigService.isDemoMode()) {
                config.splice(1, 0, {
                    tabName: $i18next.t('common:ANALYTICS', { lng: lng }),
                    id: 'analytics',
                    uiRoute: 'app.container.analytics',
                    capability: 'containers.analytics'
                });
            }

            return config;
        }

        /**
         * Returns clusters navigation tabs config
         * @returns {Array.<Object>}
         */
        function getClustersConfig() {
            var lng = i18next.language;

            return [{
                tabName: $i18next.t('common:NODES', { lng: lng }),
                id: 'nodes',
                uiRoute: 'app.cluster.nodes',
                capability: 'clusters.nodes'
            }];
        }

        /**
         * Returns storage pools navigation tabs config
         * @returns {Array.<Object>}
         */
        function getStoragePoolsConfig() {
            var lng = i18next.language;

            var config = [{
                tabName: $i18next.t('common:OVERVIEW', { lng: lng }),
                id: 'overview',
                uiRoute: 'app.storage-pool.overview',
                capability: 'storagePools.overview'
            }, {
                tabName: $i18next.t('common:DEVICES', { lng: lng }),
                id: 'devices',
                uiRoute: 'app.storage-pool.devices',
                capability: 'storagePools.listDevices'
            }];

            if (ConfigService.isStagingMode()) {
                config.splice(1, 0, {
                    tabName: $i18next.t('common:CONTAINERS', { lng: lng }),
                    id: 'containers',
                    uiRoute: 'app.storage-pool.containers',
                    capability: 'storagePools.listContainers'
                });
            }

            return config;
        }

        /**
         * Returns control panel navigation tabs config
         * @returns {Array.<Object>}
         */
        function getControlPanelConfig() {
            var lng = i18next.language;

            return [{
                tabName: $i18next.t('common:LOGS', { lng: lng }),
                id: 'logs',
                uiRoute: 'app.control-panel.logs'
            }];
        }

        /**
         * Returns identity navigation tabs config
         * @returns {Array.<Object>}
         */
        function getIdentityConfig() {
            var lng = i18next.language;

            var config = [{
                tabName: $i18next.t('common:USERS', { lng: lng }),
                id: 'users',
                uiRoute: 'app.identity.users',
                capability: 'identity.users'
            }, {
                tabName: $i18next.t('common:GROUPS', { lng: lng }),
                id: 'groups',
                uiRoute: 'app.identity.groups',
                capability: 'identity.groups'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: $i18next.t('common:IDP', { lng: lng }),
                    id: 'idp',
                    uiRoute: 'app.identity.idp',
                    capability: 'identity.idp'
                });
            }

            return config;
        }

        /**
         * Returns events navigation tabs config
         * @returns {Array.<Object>}
         */
        function getEventsConfig() {
            var lng = i18next.language;

            var config = [{
                tabName: $i18next.t('common:EVENT_LOG', { lng: lng }),
                id: 'eventLog',
                uiRoute: 'app.events.event-log',
                capability: 'events.eventLog'
            }, {
                tabName: $i18next.t('common:ALERTS', { lng: lng }),
                id: '',
                uiRoute: 'app.events.alerts',
                capability: 'events.alerts'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: $i18next.t('common:ESCALATION', { lng: lng }),
                    id: 'escalation',
                    uiRoute: 'app.events.escalation',
                    capability: 'events.escalations'
                }, {
                    tabName: $i18next.t('common:TASKS', { lng: lng }),
                    id: 'tasks',
                    uiRoute: 'app.events.tasks',
                    capability: 'events.tasks'
                });
            }

            return config;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    SearchInputController.$inject = ['$scope', '$timeout'];
    angular.module('iguazio.dashboard-controls').component('nclSearchInput', {
        bindings: {
            dataSet: '<',
            searchKeys: '<',
            searchStates: '<',
            searchCallback: '&?',
            isSearchHierarchically: '@?',
            placeholder: '@',
            type: '@?',
            ruleType: '@?',
            searchType: '@?'
        },
        templateUrl: 'nuclio/common/components/nuclio-search-input/search-input.tpl.html',
        controller: SearchInputController
    });

    function SearchInputController($scope, $timeout) {
        var ctrl = this;

        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;
        ctrl.onPressEnter = onPressEnter;
        ctrl.clearInputField = clearInputField;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$watch('$ctrl.searchQuery', onChangeSearchQuery);
        }

        //
        // Public methods
        //

        /**
         * Initializes search on press enter
         * @param {Event} e
         */
        function onPressEnter(e) {
            if (e.keyCode === 13) {
                makeSearch();
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.searchQuery = '';
        }

        //
        // Private methods
        //

        /**
         * Calls service method for search
         */
        function makeSearch() {}
        // TODO


        /**
         * Tracks input changing and initializes search
         */
        function onChangeSearchQuery(newValue, oldValue) {
            if (angular.isDefined(newValue) && newValue !== oldValue) {
                makeSearch();
            }
        }

        /**
         * Initializes search when all html has been rendered
         */
        function onDataChanged() {
            $timeout(makeSearch);
        }

        /**
         * Resets search query and initializes search
         */
        function resetSearch() {
            ctrl.searchQuery = '';
            $timeout(makeSearch);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    CreateFunctionController.$inject = ['$element', '$rootScope', '$scope', '$state', '$stateParams', '$i18next', 'i18next', 'ngDialog', 'lodash', 'DialogsService', 'NuclioHeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclCreateFunction', {
        bindings: {
            createProject: '&',
            getProject: '&',
            getProjects: '&',
            getTemplates: '&',
            renderTemplate: '&',
            templates: '<'
        },
        templateUrl: 'nuclio/common/screens/create-function/create-function.tpl.html',
        controller: CreateFunctionController
    });

    function CreateFunctionController($element, $rootScope, $scope, $state, $stateParams, $i18next, i18next, ngDialog, lodash, DialogsService, NuclioHeaderService) {
        var ctrl = this;
        var lng = i18next.language;
        var selectedFunctionType = 'from_template';

        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.project = {};
        ctrl.projects = [];
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            },
            callbacks: {
                onUpdate: onContainerResize
            }
        };
        ctrl.selectedProject = null;
        ctrl.horizontalScrollConfig = {
            axis: 'x',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createNewProject = createNewProject;
        ctrl.toggleSplashScreen = toggleSplashScreen;
        ctrl.isTypeSelected = isTypeSelected;
        ctrl.selectFunctionType = selectFunctionType;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // get all projects, only if project wasn't selected before. In other words:
            // whether New Function screen was opened from Projects or Functions screen.
            if (lodash.includes(['projects', 'home-page', ''], $stateParams.navigatedFrom)) {
                ctrl.getProjects().then(function (response) {
                    ctrl.projects = response;

                    // breadcrumbs config
                    var title = {
                        function: 'Create function'
                    };

                    if (!lodash.isEmpty(ctrl.projects)) {

                        // get first project
                        var project = lodash.find(ctrl.projects);

                        ctrl.selectedProject = {
                            id: project.metadata.name,
                            name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                        };
                    }

                    $rootScope.$broadcast('update-main-header-title', title);
                }).catch(function (error) {
                    var msg = $i18next.t('functions:ERROR_MSG.GET_PROJECTS', { lng: lng });

                    DialogsService.alert(lodash.get(error, 'data.error', msg));

                    $state.go($stateParams.navigatedFrom === 'home-page' ? 'app.home' : 'app.projects');
                }).finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
            } else {
                ctrl.getProject({ id: $stateParams.projectId }).then(function (project) {
                    ctrl.project = project;

                    // breadcrumbs config
                    var title = {
                        project: project,
                        function: 'Create function'
                    };

                    NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);
                }).catch(function (error) {
                    var msg = $i18next.t('functions:ERROR_MSG.GET_PROJECT', { lng: lng });

                    DialogsService.alert(lodash.get(error, 'data.error', msg));

                    $state.go('app.projects');
                }).finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
            }
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            if (!lodash.isEmpty(ctrl.project)) {
                $state.go('app.project.functions', {
                    projectId: ctrl.project.metadata.name,
                    createCancelled: true
                });
            } else {
                $state.go('app.projects');
            }
        }

        /**
         * New project dialog
         */
        function createNewProject() {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)" ' + 'data-create-project-callback="ngDialogData.createProject({project: project})"></ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createProject: ctrl.createProject
                },
                className: 'ngdialog-theme-nuclio'
            }).closePromise.then(function (data) {
                if (!lodash.isNil(data.value)) {
                    ctrl.isSplashShowed.value = true;

                    ctrl.getProjects().then(function (response) {
                        ctrl.projects = response;
                        var createdProject = lodash.find(ctrl.projects, ['metadata.name', data.value.metadata.name]);

                        ctrl.selectedProject = {
                            id: createdProject.metadata.name,
                            name: createdProject.metadata.name
                        };
                    }).catch(function (error) {
                        var msg = $i18next.t('functions:ERROR_MSG.GET_PROJECTS', { lng: lng });

                        DialogsService.alert(lodash.get(error, 'data.error', msg));
                    }).finally(function () {
                        ctrl.isSplashShowed.value = false;
                    });

                    $rootScope.$broadcast('close-drop-down');
                }
            });
        }

        /**
         * Toggles splash screen.
         * If value is undefined then sets opposite itself's value, otherwise sets provided value.
         * @param {boolean} value - value to be set
         */
        function toggleSplashScreen(value) {
            ctrl.isSplashShowed.value = lodash.defaultTo(value, !ctrl.isSplashShowed.value);
        }

        /**
         * Checks which function type is visible.
         * Returns true if 'functionType' is equal to 'selectedFunctionType'. Which means that function with type from
         * argument 'functionType' should be visible.
         * @param {string} functionType
         * @returns {boolean}
         */
        function isTypeSelected(functionType) {
            return lodash.isEqual(selectedFunctionType, functionType);
        }

        /**
         * Sets selected function type
         * @param {string} functionType
         */
        function selectFunctionType(functionType) {
            if (!lodash.isEqual(functionType, selectedFunctionType)) {
                selectedFunctionType = functionType;
            }
        }

        /**
         * Scrollbar callback.
         * If we create function from template, then resize templates wrapper according to inner content.
         * Needed to place 'Create function' button on right position.
         */
        function onContainerResize() {
            var templatesWrapper = $element.find('.templates-wrapper');

            // width of one template
            var templateWidth = 368;

            if (selectedFunctionType === 'from_template') {
                templatesWrapper.css('width', '100%');

                // count amount of templates in one line
                var elementsPerLine = Math.floor(parseInt(templatesWrapper.css('width')) / templateWidth);

                templatesWrapper.css('width', templateWidth * elementsPerLine + 'px');
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FunctionsController.$inject = ['$filter', '$q', '$rootScope', '$scope', '$state', '$stateParams', '$transitions', '$timeout', '$i18next', 'i18next', 'lodash', 'CommonTableService', 'ConfigService', 'DialogsService', 'NuclioHeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctions', {
        bindings: {
            deleteFunction: '&',
            createFunction: '&',
            getExternalIpAddresses: '&',
            getProject: '&',
            getFunction: '&',
            getFunctions: '&',
            onUpdateFunction: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/functions.tpl.html',
        controller: FunctionsController
    });

    function FunctionsController($filter, $q, $rootScope, $scope, $state, $stateParams, $transitions, $timeout, $i18next, i18next, lodash, CommonTableService, ConfigService, DialogsService, NuclioHeaderService) {
        var ctrl = this;
        var lng = i18next.language;
        var title = {}; // breadcrumbs config

        ctrl.actions = [];
        ctrl.filtersCounter = 0;
        ctrl.functions = [];
        ctrl.isFiltersShowed = {
            value: false,
            changeValue: function changeValue(newVal) {
                this.value = newVal;
            }
        };
        ctrl.isReverseSorting = false;
        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.project = {};
        ctrl.searchStates = {};
        ctrl.searchKeys = ['metadata.name', 'spec.description'];
        ctrl.sortOptions = [{
            label: $i18next.t('common:NAME', { lng: lng }),
            value: 'metadata.name',
            active: true
        }, {
            label: $i18next.t('common:DESCRIPTION', { lng: lng }),
            value: 'spec.description',
            active: false
        }, {
            label: $i18next.t('common:STATUS', { lng: lng }),
            value: 'status.state',
            active: false
        }, {
            label: $i18next.t('common:REPLICAS', { lng: lng }),
            value: 'spec.replicas',
            active: false
        }, {
            label: $i18next.t('functions:RUNTIME', { lng: lng }),
            value: 'spec.runtime',
            active: false
        }];
        ctrl.sortedColumnName = 'metadata.name';
        ctrl.externalIPAddress = '';

        ctrl.$onInit = onInit;

        ctrl.getColumnSortingClasses = CommonTableService.getColumnSortingClasses;

        ctrl.getVersions = getVersions;
        ctrl.handleAction = handleAction;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isFunctionsListEmpty = isFunctionsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
        ctrl.onResetFilters = onResetFilters;
        ctrl.onUpdateFiltersCounter = onUpdateFiltersCounter;
        ctrl.openNewFunctionScreen = openNewFunctionScreen;
        ctrl.refreshFunctions = refreshFunctions;
        ctrl.sortTableByColumn = sortTableByColumn;
        ctrl.toggleFilters = toggleFilters;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isEmpty($stateParams.projectId)) {
                $state.go('app.projects');
            } else {
                ctrl.isSplashShowed.value = true;

                ctrl.getProject({ id: $stateParams.projectId }).then(function (project) {
                    ctrl.project = project;

                    title.project = ctrl.project;

                    NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);

                    ctrl.getExternalIpAddresses().then(function (response) {
                        ctrl.externalIPAddress = lodash.get(response, 'externalIPAddresses.addresses[0]', '');
                    }).catch(function () {
                        ctrl.externalIPAddress = '';
                    }).finally(function () {

                        // it is important to render function list only after external IP addresses response is
                        // back, otherwise the "Invocation URL" column might be "N/A" to a function (even if it
                        // is deployed, i.e. `status.httpPort` is a number), because as long as the external IP
                        // address response is not returned, it is empty and is passed to each function row
                        ctrl.refreshFunctions();
                    });
                }).catch(function (error) {
                    ctrl.isSplashShowed.value = false;
                    var msg = $i18next.t('functions:ERROR_MSG.GET_PROJECT', { lng: lng });
                    DialogsService.alert(lodash.get(error, 'data.error', msg)).then(function () {
                        $state.go('app.projects');
                    });
                });
            }

            ctrl.actions = initVersionActions();

            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox_item-checked', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', function () {
                $timeout(updatePanelActions);
            });

            $transitions.onStart({}, stateChangeStart);

            updatePanelActions();
        }

        //
        // Public methods
        //

        /**
         * Gets list of function versions
         * @returns {string[]}
         */
        function getVersions() {
            return lodash.chain(ctrl.functions).map(function (functionItem) {

                // TODO
                return functionItem.version === -1 ? [] : functionItem.versions;
            }).flatten().value();
        }

        /**
         * Checks if functions list is empty
         * @returns {boolean}
         */
        function isFunctionsListEmpty() {
            return lodash.isEmpty(ctrl.functions);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} checkedItems - an array of checked projects
         * @returns {Promise}
         */
        function handleAction(actionType, checkedItems) {
            var promises = [];

            lodash.forEach(checkedItems, function (checkedItem) {
                var actionHandler = checkedItem.ui[actionType];

                if (lodash.isFunction(actionHandler)) {
                    promises.push(actionHandler());
                }
            });

            return $q.all(promises).then(function () {
                ctrl.isSplashShowed.value = false;
            });
        }

        /**
         * Updates functions list depends on filters value
         */
        function onApplyFilters() {
            $rootScope.$broadcast('search-input_refresh-search');
        }

        /**
         * Sorts the table by column name depends on selected value in sort dropdown
         * @param {Object} option
         */
        function onSortOptionsChange(option) {
            var previousElement = lodash.find(ctrl.sortOptions, ['active', true]);
            var newElement = lodash.find(ctrl.sortOptions, ['label', option.label]);

            // change state of selected element, and of previous element
            previousElement.active = false;
            newElement.active = true;

            // if previous value is equal to new value, then change sorting predicate
            if (previousElement.label === newElement.label) {
                newElement.desc = !option.desc;
            }

            ctrl.isReverseSorting = newElement.desc;
            ctrl.sortedColumnName = newElement.value;

            ctrl.sortTableByColumn(ctrl.sortedColumnName);
        }

        /**
         * Handles on reset filters event
         */
        function onResetFilters() {
            $rootScope.$broadcast('search-input_reset');

            ctrl.filtersCounter = 0;
        }

        /**
         * Handles on update filters counter
         * @param {string} searchQuery
         */
        function onUpdateFiltersCounter(searchQuery) {
            ctrl.filtersCounter = lodash.isEmpty(searchQuery) ? 0 : 1;
        }

        /**
         * Navigates to new function screen
         */
        function openNewFunctionScreen() {
            title.function = 'Create function';

            NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);

            $state.go('app.project.create-function');
        }

        /**
         * Refreshes function list
         */
        function refreshFunctions() {
            ctrl.isSplashShowed.value = true;

            ctrl.getFunctions({ id: ctrl.project.metadata.name }).then(function (functions) {
                ctrl.functions = lodash.map(functions, function (functionFromResponse) {
                    var foundFunction = lodash.find(ctrl.functions, ['metadata.name', functionFromResponse.metadata.name]);
                    var ui = lodash.get(foundFunction, 'ui');
                    functionFromResponse.ui = lodash.defaultTo(ui, functionFromResponse.ui);

                    return functionFromResponse;
                });

                if (lodash.isEmpty(ctrl.functions) && !$stateParams.createCancelled) {
                    ctrl.isSplashShowed.value = false;

                    $state.go('app.project.create-function');
                } else {

                    // TODO: unmock versions data
                    lodash.forEach(ctrl.functions, function (functionItem) {
                        lodash.set(functionItem, 'versions', [{
                            name: '$LATEST',
                            invocation: '30',
                            last_modified: '2018-02-05T17:07:48.509Z'
                        }]);
                        lodash.set(functionItem, 'spec.version', 1);
                    });
                }
            }).catch(function (error) {
                var msg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS', { lng: lng });
                DialogsService.alert(lodash.get(error, 'data.error', msg));
            }).finally(function () {
                ctrl.isSplashShowed.value = false;
            });
        }

        /**
         * Sorts the table by column name
         * @param {string} columnName - name of column
         * @param {boolean} isJustSorting - if it is needed just to sort data without changing reverse
         */
        function sortTableByColumn(columnName, isJustSorting) {
            if (!isJustSorting) {

                // changes the order of sorting the column
                ctrl.isReverseSorting = columnName === ctrl.sortedColumnName ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            ctrl.functions = $filter('orderBy')(ctrl.functions, columnName, ctrl.isReverseSorting);
        }

        /**
         * Opens a splash screen on start change state
         */
        function stateChangeStart() {
            ctrl.isSplashShowed.value = true;
        }

        /**
         * Shows/hides filters panel
         */
        function toggleFilters() {
            ctrl.isFiltersShowed.value = !ctrl.isFiltersShowed.value;
        }

        //
        // Private methods
        //

        /**
         * Actions for Action panel
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var actions = [{
                label: $i18next.t('common:EDIT', { lng: lng }),
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('functions:DELETE_VERSION_CONFIRM', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'critical_alert'
                }
            }];

            return actions;
        }

        /**
         * Handler on action-panel broadcast
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {string} data.action - a name of action
         */
        function onFireAction(event, data) {
            var checkedRows = lodash.chain(ctrl.functions).map(function (functionItem) {
                return lodash.filter(functionItem.versions, 'ui.checked');
            }).flatten().value();

            ctrl.handleAction(data.action, checkedRows);
        }

        /**
         * Updates actions of action panel according to selected versions
         */
        function updatePanelActions() {
            var checkedRows = lodash.chain(ctrl.functions).map(function (functionItem) {
                return lodash.filter(functionItem.versions, 'ui.checked');
            }).flatten().value();

            if (checkedRows.length > 0) {

                // sets visibility status of `edit action`
                // visible if only one version is checked
                var editAction = lodash.find(ctrl.actions, { 'id': 'edit' });
                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRows.length === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.actions, { 'id': 'delete' });
                if (!lodash.isNil(deleteAction)) {
                    var message = checkedRows.length === 1 ? $i18next.t('functions:DELETE_VERSION', { lng: lng }) + ' “' + checkedRows[0].name + '”?' : $i18next.t('functions:DELETE_VERSION_CONFIRM', { lng: lng });

                    deleteAction.confirm = {
                        message: message,
                        yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                        noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                        type: 'nuclio_alert'
                    };
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FunctionsService.$inject = ['$i18next', 'i18next', 'lodash'];
    angular.module('iguazio.dashboard-controls').factory('FunctionsService', FunctionsService);

    function FunctionsService($i18next, i18next, lodash) {
        return {
            getClassesList: getClassesList,
            getHandler: getHandler,
            initVersionActions: initVersionActions
        };

        //
        // Public methods
        //

        /**
         * Returns classes list by type
         * @returns {Object[]} - array of classes
         */
        function getClassesList(type) {
            var classesList = {
                trigger: [{
                    id: 'kafka-cluster',
                    name: 'Kafka',
                    attributes: [{
                        name: 'kafka-topics',
                        values: {
                            topic: {
                                name: 'topic',
                                type: 'input',
                                pattern: 'string'
                            }
                        }
                    }, {
                        name: 'kafka-brokers',
                        values: {
                            topic: {
                                name: 'brokers',
                                type: 'input',
                                pattern: 'string'
                            }
                        }
                    }, {
                        name: 'consumerGroup',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: true
                    }, {
                        name: 'initialOffset',
                        values: [{
                            id: 'earliest',
                            name: 'Earliest',
                            visible: true
                        }, {
                            id: 'latest',
                            name: 'Latest',
                            visible: true
                        }],
                        defaultValue: 'latest',
                        pattern: 'string',
                        type: 'dropdown'
                    }, {
                        name: 'sasl',
                        values: {
                            enable: {
                                name: 'saslEnabled',
                                type: 'checkbox',
                                defaultValue: false
                            },
                            user: {
                                name: 'saslUsername',
                                type: 'input',
                                defaultValue: ''
                            },
                            password: {
                                name: 'saslPassword',
                                type: 'input',
                                defaultValue: ''
                            }
                        }
                    }]
                }, {
                    id: 'rabbit-mq',
                    name: 'RabbitMQ',
                    url: 'string',
                    attributes: [{
                        name: 'exchangeName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'queueName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: true,
                        placeholder: 'If empty, a default one will be provided'
                    }, {
                        name: 'topics',
                        pattern: 'arrayStr',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: true,
                        placeholder: 'Required if Queue Name is empty'
                    }]
                }, {
                    id: 'nats',
                    name: 'NATS',
                    url: 'string',
                    attributes: [{
                        name: 'topic',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'queueName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: true
                    }]
                }, {
                    id: 'cron',
                    name: 'Cron',
                    attributes: [{
                        name: 'interval',
                        pattern: 'interval',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false,
                        placeholder: 'E.g. 1h, 30m, 10s, 250ms'
                    }, {
                        name: 'schedule',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'event',
                        values: {
                            body: {
                                name: 'body',
                                defaultValue: ''
                            },
                            headers: {
                                name: 'headers',
                                defaultValue: {}
                            }
                        }
                    }]
                }, {
                    id: 'eventhub',
                    name: 'Eventhub',
                    attributes: [{
                        name: 'sharedAccessKeyName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'sharedAccessKeyValue',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'namespace',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'eventHubName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'consumerGroup',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'partitions',
                        pattern: 'arrayInt',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }]
                }, {
                    id: 'http',
                    name: 'HTTP',
                    maxWorkers: 'number',
                    workerAvailabilityTimeoutMilliseconds: {
                        name: 'workerAvailabilityTimeoutMilliseconds',
                        pattern: 'number',
                        type: 'number-input',
                        allowEmpty: false,
                        defaultValue: 0
                    },
                    attributes: [{
                        name: 'port',
                        pattern: 'number',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: true
                    }, {
                        name: 'ingresses',
                        pattern: 'object',
                        type: 'key-value'
                    }],
                    annotations: {
                        name: 'annotations',
                        pattern: 'object',
                        type: 'key-value'
                    }
                }, {
                    id: 'v3ioStream',
                    name: 'V3IO stream',
                    url: 'string',
                    username: 'string',
                    password: 'string',
                    attributes: [{
                        name: 'partitions',
                        pattern: 'arrayInt',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'seekTo',
                        values: [{
                            id: 'earliest',
                            name: 'Earliest',
                            visible: true
                        }, {
                            id: 'latest',
                            name: 'Latest',
                            visible: true
                        }],
                        pattern: 'string',
                        type: 'dropdown'
                    }, {
                        name: 'readBatchSize',
                        pattern: 'number',
                        type: 'number-input',
                        allowEmpty: true,
                        defaultValue: 64
                    }, {
                        name: 'pollingIntervalMs',
                        unit: 'ms',
                        pattern: 'number',
                        type: 'number-input',
                        allowEmpty: true,
                        defaultValue: 500
                    }]
                }, {
                    id: 'kinesis',
                    name: 'Kinesis',
                    attributes: [{
                        name: 'accessKeyID',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'secretAccessKey',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'regionName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'streamName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'shards',
                        pattern: 'arrayStr',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }]
                }, {
                    id: 'mqtt',
                    name: 'MQTT',
                    url: 'string',
                    username: 'string',
                    password: 'string',
                    attributes: [{
                        name: 'subscriptions',
                        values: {
                            topic: {
                                name: 'topic',
                                type: 'input',
                                pattern: 'string'
                            },
                            qos: {
                                name: 'QoS',
                                type: 'input',
                                pattern: 'number'
                            }
                        }
                    }]
                }],
                binding: [{
                    id: 'v3io',
                    name: 'V3IO',
                    url: 'string',
                    attributes: [{
                        name: 'containerID',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'numWorkers',
                        pattern: 'number',
                        type: 'number-input',
                        allowEmpty: true,
                        defaultValue: 8,
                        maxValue: 100
                    }, {
                        name: 'username',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'password',
                        pattern: 'password',
                        type: 'input',
                        fieldType: 'password',
                        allowEmpty: false
                    }]
                }, {
                    id: 'eventhub',
                    name: 'Eventhub',
                    attributes: [{
                        name: 'sharedAccessKeyName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'sharedAccessKeyValue',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'namespace',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }, {
                        name: 'eventHubName',
                        pattern: 'string',
                        type: 'input',
                        fieldType: 'input',
                        allowEmpty: false
                    }]
                }],
                volume: [{
                    id: 'v3io',
                    name: 'V3IO',
                    tooltip: $i18next.t('functions:TOOLTIP.V3IO', { lng: i18next.language })
                }, {
                    id: 'secret',
                    name: 'Secret',
                    tooltip: $i18next.t('functions:TOOLTIP.SECRET.HEAD', { lng: i18next.language }) + ' ' + $i18next.t('functions:TOOLTIP.SECRET.REST', { lng: i18next.language })
                }, {
                    id: 'configMap',
                    name: 'ConfigMap',
                    tooltip: $i18next.t('functions:TOOLTIP.CONFIG_MAP.HEAD', { lng: i18next.language }) + ' ' + $i18next.t('functions:TOOLTIP.CONFIG_MAP.REST', { lng: i18next.language })
                }, {
                    id: 'persistentVolumeClaim',
                    name: 'PVC'
                }]
            };

            return classesList[type];
        }

        /**
         * Returns the appropriate handler regarding runtime
         * @param {string} runtime
         * @returns {string} handler
         */
        function getHandler(runtime) {
            var handlers = {
                'golang': 'main:Handler',
                'java': 'Handler',
                'shell': 'main.sh'
            };

            return lodash.get(handlers, runtime, 'main:handler');
        }

        /**
         * Actions for Action panel
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var lng = i18next.language;

            return [{
                label: $i18next.t('common:EDIT', { lng: lng }),
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('functions:DELETE_VERSION_CONFIRM', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'critical_alert'
                }
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclTextSizeDropdownController.$inject = ['$i18next', 'i18next', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('nclTextSizeDropdown', {
        bindings: {
            updateDataCallback: '&?'
        },
        templateUrl: 'nuclio/common/components/monaco/text-size-dropdown/text-size-dropdown.tpl.html',
        controller: NclTextSizeDropdownController
    });

    function NclTextSizeDropdownController($i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.textSizes = [{
            label: $i18next.t('functions:SMALL', { lng: lng }),
            id: 'small',
            value: '8px'
        }, {
            label: $i18next.t('functions:NORMAL', { lng: lng }),
            id: 'normal',
            value: '12px'
        }, {
            label: $i18next.t('functions:LARGE', { lng: lng }),
            id: 'large',
            value: '16px'
        }, {
            label: $i18next.t('functions:HUGE', { lng: lng }),
            id: 'huge',
            value: '20px'
        }];

        ctrl.$onInit = onInit;

        ctrl.changeTextSize = changeTextSize;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            ctrl.selectedTextSize = lodash.get(lodash.find(ctrl.textSizes, { id: 'normal' }), 'value');

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({ newTextSize: ctrl.selectedTextSize });
            }
        }

        //
        // Public methods
        //

        /**
         * Changes text size in monaco editor
         * @param {string} textSize
         */
        function changeTextSize(textSize) {
            ctrl.selectedTextSize = textSize;

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({ newTextSize: ctrl.selectedTextSize });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FunctionFromScratchController.$inject = ['$document', '$state', '$timeout', 'lodash', 'ConfigService', 'EventHelperService', 'FunctionsService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionFromScratch', {
        bindings: {
            project: '<',
            projects: '<',
            toggleSplashScreen: '&',
            createNewProject: '<',
            selectedProject: '<'
        },
        templateUrl: 'nuclio/common/screens/create-function/function-from-scratch/function-from-scratch.tpl.html',
        controller: FunctionFromScratchController
    });

    function FunctionFromScratchController($document, $state, $timeout, lodash, ConfigService, EventHelperService, FunctionsService, ValidatingPatternsService) {
        var ctrl = this;

        ctrl.functionFromScratchForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.functionData = {};
        ctrl.runtimes = [];
        ctrl.selectedRuntime = null;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isCreateFunctionAllowed = isCreateFunctionAllowed;
        ctrl.isProjectsDropDownVisible = isProjectsDropDownVisible;
        ctrl.onRuntimeChange = onRuntimeChange;
        ctrl.onProjectChange = onProjectChange;

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.runtimes = getRuntimes();
            ctrl.selectedRuntime = getDefaultRuntime();

            $document.on('keypress', createFunction);

            initFunctionData();
        }

        /**
         * Bindings changes hook
         * @param {Object} changes - changed bindings
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.projects)) {
                prepareProjects();
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('keypress', createFunction);
        }

        //
        // Public methods
        //

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction(event) {
            $timeout(function () {
                if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.isCreateFunctionAllowed()) {

                    // create function only when form is valid
                    if (ctrl.functionFromScratchForm.$valid) {
                        ctrl.toggleSplashScreen({ value: true });

                        lodash.defaultsDeep(ctrl, {
                            functionData: {
                                metadata: {}
                            }
                        });

                        if (lodash.isEmpty(ctrl.project) && ctrl.selectedProject.id !== 'new_project') {
                            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', ctrl.selectedProject.id]);
                        }

                        $state.go('app.project.function.edit.code', {
                            isNewFunction: true,
                            id: ctrl.project.metadata.name,
                            functionId: ctrl.functionData.metadata.name,
                            projectId: ctrl.project.metadata.name,
                            projectNamespace: ctrl.project.metadata.namespace,
                            functionData: ctrl.functionData
                        });
                    }
                }
            }, 100);
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         * @param {string} field - field which should be filled
         */
        function inputValueCallback(data, field) {
            $timeout(function () {
                if (!lodash.isNil(data)) {
                    lodash.set(ctrl, 'functionData.metadata.' + field, data);
                }
            });
        }

        /**
         * Checks permissibility creation of new function.
         * @returns {boolean}
         */
        function isCreateFunctionAllowed() {
            return lodash.isEmpty(ctrl.functionFromScratchForm.$error);
        }

        /**
         * Hides or shows projects drop-down.
         * Show drop-down if 'Create Function' screen was reached from 'Projects' screen. Otherwise - hide drop-down
         * @returns {boolean}
         */
        function isProjectsDropDownVisible() {
            return $state.current.name === 'app.create-function';
        }

        /**
         * Set data returned by default drop-down component
         * @param {Object} item - the new data
         * @param {boolean} isItemChanged - was value changed or not
         */
        function onRuntimeChange(item, isItemChanged) {
            if (!lodash.isNil(item) && isItemChanged) {
                lodash.assign(ctrl.functionData.spec, {
                    runtime: item.id,
                    handler: FunctionsService.getHandler(item.id),
                    build: {
                        functionSourceCode: item.sourceCode
                    }
                });
            }
        }

        /**
         * Projects drop-down callback.
         * Sets selected project to function.
         * @param {Object} item - new selected project
         */
        function onProjectChange(item) {
            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', item.id]);
        }

        //
        // Private methods
        //

        /**
         * Gets all runtimes
         * @returns {Array}
         */
        function getRuntimes() {
            return [{
                id: 'golang',
                name: 'Go',
                sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' + 'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' + '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                visible: true
            }, {
                id: 'python:2.7',
                name: 'Python 2.7',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'python:3.6',
                name: 'Python 3.6',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'dotnetcore',
                name: '.NET Core',
                sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' + 'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' + '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' + 'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' + 'fQ==', // source code in base64
                visible: true
            }, {
                id: 'java',
                name: 'Java',
                sourceCode: 'aW1wb3J0IGlvLm51Y2xpby5Db250ZXh0Ow0KaW1wb3J0IGlvLm51Y2xpby5FdmVudDsNCmltcG9ydCBpby5udWN' + 'saW8uRXZlbnRIYW5kbGVyOw0KaW1wb3J0IGlvLm51Y2xpby5SZXNwb25zZTsNCg0KcHVibGljIGNsYXNzIEhhbmRsZXIgaW1wbG' + 'VtZW50cyBFdmVudEhhbmRsZXIgew0KDQogICAgQE92ZXJyaWRlDQogICAgcHVibGljIFJlc3BvbnNlIGhhbmRsZUV2ZW50KENvb' + 'nRleHQgY29udGV4dCwgRXZlbnQgZXZlbnQpIHsNCiAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCkuc2V0Qm9keSgiIik7DQog' + 'ICAgfQ0KfQ==',
                visible: true
            }, {
                id: 'nodejs',
                sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' + 'rKCcnKTsNCn07', // source code in base64
                name: 'NodeJS',
                visible: true
            }, {
                id: 'shell',
                name: 'Shell',
                sourceCode: '',
                visible: true
            }, {
                id: 'ruby',
                name: 'Ruby',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpDQplbmQ=', // source code in base64
                visible: true
            }];
        }

        /**
         * Gets default runtime
         * @returns {object} default runtime
         */
        function getDefaultRuntime() {
            return lodash.find(ctrl.runtimes, ['id', 'golang']);
        }

        /**
         * Initialize object for function from scratch
         */
        function initFunctionData() {
            ctrl.functionData = {
                metadata: {
                    name: '',
                    namespace: '',
                    labels: {},
                    annotations: {}
                },
                spec: {
                    description: '',
                    disable: false,
                    triggers: {},
                    env: [],
                    loggerSinks: [{
                        level: 'debug',
                        sink: ''
                    }],
                    handler: FunctionsService.getHandler(ctrl.selectedRuntime.id),
                    runtime: ctrl.selectedRuntime.id,
                    build: {
                        functionSourceCode: ctrl.selectedRuntime.sourceCode
                    }
                }
            };

            if (ConfigService.isDemoMode()) {
                ctrl.functionData.spec.timeoutSeconds = 0;
            }
        }

        /**
         * Converts projects for project drop-down.
         */
        function prepareProjects() {
            var newProject = {
                id: 'new_project',
                name: 'New project'
            };

            ctrl.selectedProject = lodash.isNil(ctrl.selectedProject) ? newProject : ctrl.selectedProject;

            ctrl.projectsList = lodash.chain(ctrl.projects).map(function (project) {
                return {
                    id: project.metadata.name,
                    name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                };
            }).sortBy(['name']).value();

            ctrl.selectedProject = lodash.isEmpty(ctrl.projectsList) ? newProject : ctrl.selectedProject.id !== 'new_project' ? ctrl.selectedProject : lodash.first(ctrl.projectsList);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FunctionImportController.$inject = ['$document', '$rootScope', '$scope', '$state', '$timeout', '$i18next', 'i18next', 'YAML', 'lodash', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionImport', {
        bindings: {
            project: '<',
            projects: '<',
            toggleSplashScreen: '&',
            createNewProject: '<',
            selectedProject: '<'
        },
        templateUrl: 'nuclio/common/screens/create-function/function-import/function-import.tpl.html',
        controller: FunctionImportController
    });

    function FunctionImportController($document, $rootScope, $scope, $state, $timeout, $i18next, i18next, YAML, lodash, EventHelperService) {
        var ctrl = this;

        var importedFunction = null;
        var file = null;
        var lng = i18next.language;

        ctrl.functionImportForm = {};
        ctrl.sourceCode = null;
        ctrl.editorTheme = {
            id: 'vs',
            name: 'Light',
            visible: true
        };

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.createFunction = createFunction;
        ctrl.importFunction = importFunction;
        ctrl.isCreateFunctionAllowed = isCreateFunctionAllowed;
        ctrl.isProjectsDropDownVisible = isProjectsDropDownVisible;
        ctrl.onProjectChange = onProjectChange;

        //
        // Hook methods
        //

        /**
         * Initialization function
         * Adds event listener on file input and when some file is loaded call importFunction()
         */
        function onInit() {
            $document.on('keypress', createFunction);
            angular.element(document).find('.function-import-input').on('change', importFunction);
        }

        /**
         * Bindings changes hook
         * @param {Object} changes - changed bindings
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.projects)) {
                prepareProjects();
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('keypress', createFunction);
        }

        //
        // Public methods
        //

        /**
         * Callback handler for 'create function' button
         * Creates function with imported data.
         */
        function createFunction(event) {
            $timeout(function () {
                if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.isCreateFunctionAllowed()) {

                    // create function only when imported file is .yml
                    if (isYamlFile(file.name)) {
                        ctrl.toggleSplashScreen({ value: true });

                        lodash.defaults(importedFunction, {
                            metadata: {}
                        });

                        if (lodash.isEmpty(ctrl.project) && ctrl.selectedProject.id !== 'new_project') {
                            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', ctrl.selectedProject.id]);
                        }

                        $state.go('app.project.function.edit.code', {
                            isNewFunction: true,
                            id: ctrl.project.metadata.name,
                            functionId: importedFunction.metadata.name,
                            projectId: ctrl.project.metadata.name,
                            projectNamespace: ctrl.project.metadata.namespace,
                            functionData: importedFunction
                        });
                    }
                }
            }, 100);
        }

        /**
         * Checks permissibility creation of new function.
         * Checks if source code of function exists into ctrl.sourceCode, and if function import form is valid
         * @returns {boolean}
         */
        function isCreateFunctionAllowed() {
            return !lodash.isNil(ctrl.sourceCode) && lodash.isEmpty(ctrl.functionImportForm.$error);
        }

        /**
         * Import of selected YAML file from file system and parse it to JS object
         * @param event
         */
        function importFunction(event) {
            file = event.target.files[0];

            var reader = new FileReader();

            reader.onload = function () {
                ctrl.sourceCode = reader.result;
                $scope.$apply();
                $rootScope.$broadcast('function-import-source-code', ctrl.sourceCode);

                importedFunction = YAML.parse(reader.result);
            };

            reader.readAsText(file);
        }

        /**
         * Projects drop-down callback.
         * Sets selected project to function.
         * @param {Object} item - new selected project
         */
        function onProjectChange(item) {
            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', item.id]);
        }

        /**
         * Hides or shows projects drop-down.
         * Show drop-down if 'Create Function' screen was reached from 'Projects' screen. Otherwise - hide drop-down
         * @returns {boolean}
         */
        function isProjectsDropDownVisible() {
            return $state.current.name === 'app.create-function';
        }

        //
        // Private methods
        //

        /**
         * Checks if file imported from file system is YAML extension.
         * Example: 'filename.yml'
         * @returns {boolean}
         */
        function isYamlFile(filename) {
            return lodash.includes(filename, '.yml') || lodash.includes(filename, '.yaml');
        }

        /**
         * Converts projects for project drop-down.
         */
        function prepareProjects() {
            var newProject = {
                id: 'new_project',
                name: $i18next.t('functions:NEW_PROJECT', { lng: lng })
            };

            ctrl.selectedProject = lodash.isNil(ctrl.selectedProject) ? newProject : ctrl.selectedProject;

            ctrl.projectsList = lodash.chain(ctrl.projects).map(function (project) {
                return {
                    id: project.metadata.name,
                    name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                };
            }).sortBy(['name']).value();

            ctrl.selectedProject = lodash.isEmpty(ctrl.projectsList) ? newProject : ctrl.selectedProject.id !== 'new_project' ? ctrl.selectedProject :
            /* else */lodash.first(ctrl.projectsList);
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    FunctionFromTemplateController.$inject = ['$element', '$window', '$scope', '$state', '$timeout', '$i18next', 'i18next', 'lodash', 'ngDialog', 'DialogsService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionFromTemplate', {
        bindings: {
            project: '<',
            projects: '<',
            toggleSplashScreen: '&',
            getFunctionTemplates: '&',
            createNewProject: '<',
            renderTemplate: '&',
            selectedProject: '<'
        },
        templateUrl: 'nuclio/common/screens/create-function/function-from-template/function-from-template.tpl.html',
        controller: FunctionFromTemplateController
    });

    function FunctionFromTemplateController($element, $window, $scope, $state, $timeout, $i18next, i18next, lodash, ngDialog, DialogsService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;
        var templatesOriginalObject = {}; // will always save original templates

        ctrl.functionName = '';
        ctrl.templatesWorkingCopy = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.functionData = {};
        ctrl.page = {};
        ctrl.runtimeFilters = [];
        ctrl.selectedTemplate = '';
        ctrl.selectedRuntimeFilter = {
            id: 'all',
            name: $i18next.t('common:ALL', { lng: lng }),
            visible: true
        };
        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isCreateFunctionAllowed = isCreateFunctionAllowed;
        ctrl.isTemplateSelected = isTemplateSelected;
        ctrl.isProjectsDropDownVisible = isProjectsDropDownVisible;
        ctrl.onChangeSearchQuery = onChangeSearchQuery;
        ctrl.onRuntimeFilterChange = onRuntimeFilterChange;
        ctrl.onProjectChange = onProjectChange;
        ctrl.paginationCallback = paginationCallback;
        ctrl.selectTemplate = selectTemplate;
        ctrl.unselectTemplate = unselectTemplate;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.toggleSplashScreen({ value: true });

            initFunctionData();

            angular.element($window).on('resize', paginateTemplates);
        }

        /**
         * Bindings changes hook
         * @param {Object} changes - changed bindings
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.projects)) {
                prepareProjects();
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            angular.element($window).off('resize', paginateTemplates);
        }

        //
        // Public methods
        //

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction() {

            // create function only when form is valid
            if (ctrl.functionFromTemplateForm.$valid && !lodash.isNil(ctrl.selectedTemplate)) {
                lodash.assign(ctrl.functionData.rendered.metadata, {
                    name: ctrl.functionName
                });

                if (lodash.isEmpty(ctrl.project) && ctrl.selectedProject.id !== 'new_project') {
                    ctrl.project = lodash.find(ctrl.projects, ['metadata.name', ctrl.selectedProject.id]);
                }

                if (lodash.has(ctrl.functionData, 'template')) {
                    ngDialog.open({
                        template: '<ncl-function-from-template-dialog data-close-dialog="closeThisDialog(template)" data-template="$ctrl.functionData"></ncl-function-from-template-dialog>',
                        plain: true,
                        scope: $scope,
                        className: 'ngdialog-theme-nuclio function-from-template-dialog-wrapper'
                    }).closePromise.then(function (data) {
                        if (!lodash.isNil(data.value)) {
                            lodash.set(ctrl.functionData, 'values', data.value);

                            ctrl.renderTemplate({ template: lodash.omit(ctrl.functionData, ['rendered', 'metadata']) }).then(function (response) {
                                lodash.set(ctrl.functionData, 'rendered.spec', response.spec);

                                goToEditCodeScreen();
                            });
                        }
                    });
                } else {
                    goToEditCodeScreen();
                }
            }
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         */
        function inputValueCallback(data) {
            $timeout(function () {
                if (!lodash.isNil(data)) {
                    lodash.set(ctrl, 'functionName', data);
                }
            });
        }

        /**
         * Checks if function creation is allowed
         * @returns {boolean}
         */
        function isCreateFunctionAllowed() {
            return lodash.isEmpty(lodash.get(ctrl, 'functionFromTemplateForm.$error'));
        }

        /**
         * Checks which template type is selected.
         * Returns true if 'template' is equal to 'selectedTemplate'.
         * Which means that template from argument 'template' should be selected now.
         * @param {Object} templateName
         * @returns {boolean}
         */
        function isTemplateSelected(templateName) {
            return lodash.isEqual(templateName, ctrl.selectedTemplate);
        }

        /**
         * Hides or shows projects drop-down.
         * Show drop-down if 'Create Function' screen was reached from 'Projects' screen. Otherwise - hide drop-down
         * @returns {boolean}
         */
        function isProjectsDropDownVisible() {
            return $state.current.name === 'app.create-function';
        }

        /**
         * Search input callback
         */
        function onChangeSearchQuery() {
            paginateTemplates();
        }

        /**
         * Runtime filter drop-down callback
         * @param {Object} runtime - selected runtime
         */
        function onRuntimeFilterChange(runtime) {

            // set new runtime filter
            ctrl.selectedRuntimeFilter = runtime;

            paginateTemplates();
        }

        /**
         * Projects drop-down callback.
         * Sets selected project to function.
         * @param {Object} item - new selected project
         */
        function onProjectChange(item) {
            ctrl.project = lodash.find(ctrl.projects, ['metadata.name', item.id]);
        }

        /**
         * Change pagination page callback
         * @param {number} page - page number
         */
        function paginationCallback(page) {
            ctrl.page.number = page;

            paginateTemplates();

            $timeout(function () {
                setReadMoreButtonsState(ctrl.templatesWorkingCopy);
            });
        }

        /**
         * Selects template.
         * Sets new template as selected
         * @param {Object} templateName - name of the template to be set
         */
        function selectTemplate(templateName) {
            if (!lodash.isEqual(templateName, ctrl.selectedTemplate)) {
                ctrl.selectedTemplate = templateName;

                // assign new template
                ctrl.functionData = angular.copy(ctrl.templatesWorkingCopy[ctrl.selectedTemplate]);
            }
        }

        /**
         * Unselects template.
         * @param {Event} event
         */
        function unselectTemplate(event) {
            ctrl.selectedTemplate = null;
            ctrl.functionData = null;

            event.preventDefault();
            event.stopPropagation();
        }

        //
        // Private methods
        //

        /**
         * Returns true if template's runtime is matched a selected runtime filter
         * @param {Object} template - template to filter.
         * @returns {boolean}
         */
        function filterByRuntime(template) {
            return ctrl.selectedRuntimeFilter.id === 'all' || template.rendered.spec.runtime === ctrl.selectedRuntimeFilter.id;
        }

        /**
         * Returns true if template's title or description is matched a search query.
         * @param {Object} template - template to filter.
         * @returns {boolean}
         */
        function filterByTitleAndDescription(template) {
            var title = template.rendered.metadata.name.split(':')[0];
            var description = template.rendered.spec.description;

            // reset pagination to first page if one of the filters was applied
            if (!lodash.isEmpty(ctrl.searchQuery) || ctrl.selectedRuntimeFilter.id !== 'all') {
                ctrl.page.number = 0;
            }

            return lodash.isEmpty(ctrl.searchQuery) || lodash.includes(title, ctrl.searchQuery) || lodash.includes(description, ctrl.searchQuery);
        }

        /**
         * Go to `app.project.function.edit.code` screen
         */
        function goToEditCodeScreen() {
            ctrl.toggleSplashScreen({ value: true });

            $state.go('app.project.function.edit.code', {
                isNewFunction: true,
                id: ctrl.project.metadata.name,
                functionId: ctrl.functionData.rendered.metadata.name,
                projectId: ctrl.project.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace,
                functionData: ctrl.functionData.rendered
            });
        }

        /**
         * Initialize object for function from template
         */
        function initFunctionData() {

            // gets all available function templates
            ctrl.getFunctionTemplates().then(function (response) {
                ctrl.templatesWorkingCopy = response;

                templatesOriginalObject = angular.copy(ctrl.templatesWorkingCopy);
                ctrl.runtimeFilters = getRuntimeFilters();

                initPagination();

                $timeout(function () {
                    setReadMoreButtonsState(ctrl.templatesWorkingCopy);
                });
            }).catch(function (error) {
                var msg = $i18next.t('functions:ERROR_MSG.GET_FUNCTIONS_TEMPLATE', { lng: lng });

                DialogsService.alert(lodash.get(error, 'data.error', msg));
            }).finally(function () {
                ctrl.toggleSplashScreen({ value: false });
            });
        }

        /**
         * Init data for pagination
         */
        function initPagination() {
            ctrl.page = {
                number: 0,
                size: 8
            };

            paginateTemplates();
        }

        /**
         * Gets runtime filters
         * @returns {Array.<{id: string, name: string, visible: boolean}>}
         */
        function getRuntimeFilters() {
            return [{
                id: 'all',
                name: $i18next.t('common:ALL', { lng: lng }),
                visible: true
            }, {
                id: 'golang',
                name: 'Go',
                visible: true
            }, {
                id: 'python:2.7',
                name: 'Python 2.7',
                visible: true
            }, {
                id: 'python:3.6',
                name: 'Python 3.6',
                visible: true
            }, {
                id: 'dotnetcore',
                name: '.NET Core',
                visible: true
            }, {
                id: 'java',
                name: 'Java',
                visible: true
            }, {
                id: 'nodejs',
                name: 'NodeJS',
                visible: true
            }, {
                id: 'shell',
                name: 'Shell',
                visible: true
            }, {
                id: 'ruby',
                name: 'Ruby',
                visible: true
            }];
        }

        /**
         * Paginates function's templates
         */
        function paginateTemplates() {

            // amount of visible items on one page
            var pageSize = $window.innerWidth > 1453 && $window.innerWidth < 1822 ? 9 : 8;

            ctrl.templatesWorkingCopy = lodash.chain(templatesOriginalObject).filter(filterByRuntime).filter(filterByTitleAndDescription).thru(function (filteredTemplates) {
                ctrl.page.total = Math.ceil(lodash.size(filteredTemplates) / pageSize);

                return lodash.slice(filteredTemplates, ctrl.page.number * pageSize, ctrl.page.number * pageSize + pageSize);
            }).keyBy(function (template) {
                return template.rendered.metadata.name.split(':')[0] + ' (' + template.rendered.spec.runtime + ')';
            }).value();

            $timeout(setLastLineClass);
        }

        /**
         * Converts projects for project drop-down.
         */
        function prepareProjects() {
            var newProject = {
                id: 'new_project',
                name: $i18next.t('functions:NEW_PROJECT', { lng: lng })
            };

            ctrl.selectedProject = lodash.isNil(ctrl.selectedProject) ? newProject : ctrl.selectedProject;

            ctrl.projectsList = lodash.chain(ctrl.projects).map(function (project) {
                return {
                    id: project.metadata.name,
                    name: lodash.defaultTo(project.spec.displayName, project.metadata.name)
                };
            }).sortBy(['name']).value();

            ctrl.selectedProject = lodash.isEmpty(ctrl.projectsList) ? newProject : ctrl.selectedProject.id !== 'new_project' ? ctrl.selectedProject : lodash.first(ctrl.projectsList);
        }

        /**
         * Sets class `last-line` to elements from the last row of the templates list.
         */
        function setLastLineClass() {
            var TEMPLATE_WIDTH = 368;
            var templates = $element.find('.function-template-wrapper');
            var templatesWrapper = $element.find('.templates-wrapper');
            var elementsPerLine = Math.floor(parseInt(templatesWrapper.css('width')) / TEMPLATE_WIDTH);
            var countLastLineElements = lodash.size(templates) % elementsPerLine || elementsPerLine;
            var lastLineElements = lodash.takeRight(templates, countLastLineElements);

            templates.removeClass('last-line');
            angular.element(lastLineElements).addClass('last-line');
        }

        /**
         * Sets the flag to show `Read more...` in the end of template's description
         * when it is bigger than template's block can contain.
         * @param {Array} templates
         */
        function setReadMoreButtonsState(templates) {
            var templatesElements = $element.find('.template-description');

            lodash.forEach(templates, function (template) {
                var description = lodash.get(template, 'rendered.spec.description');
                var templateElement = lodash.find(templatesElements, ['innerHTML', description]);

                lodash.set(template, 'ui.readMore', templateElement.scrollHeight > angular.element(templateElement).height());
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    DuplicateFunctionDialogController.$inject = ['$state', 'lodash', 'EventHelperService', 'FormValidationService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclDuplicateFunctionDialog', {
        bindings: {
            closeDialog: '&',
            getFunctions: '&',
            project: '<',
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/duplicate-function-dialog/duplicate-function-dialog.tpl.html',
        controller: DuplicateFunctionDialogController
    });

    function DuplicateFunctionDialogController($state, lodash, EventHelperService, FormValidationService, ValidatingPatternsService) {
        var ctrl = this;

        ctrl.duplicateFunctionForm = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.nameTakenError = false;
        ctrl.newFunctionName = '';

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.duplicateFunction = duplicateFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onClose = onClose;

        //
        // Public methods
        //

        /**
         * Duplicates selected function with a new name
         * @param {Object} event
         */
        function duplicateFunction(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.nameTakenError = false;
                ctrl.duplicateFunctionForm.$submitted = true;

                if (ctrl.duplicateFunctionForm.$valid) {
                    var newFunction = lodash.pick(ctrl.version, 'spec');
                    var projectID = lodash.get(ctrl.project, 'metadata.name');

                    lodash.set(newFunction, 'metadata.name', ctrl.newFunctionName);

                    ctrl.getFunctions({ id: projectID }).then(function (response) {
                        if (lodash.isEmpty(lodash.filter(response, ['metadata.name', ctrl.newFunctionName]))) {
                            ctrl.closeDialog();

                            $state.go('app.project.function.edit.code', {
                                isNewFunction: true,
                                id: ctrl.project.metadata.name,
                                functionId: newFunction.metadata.name,
                                projectId: projectID,
                                projectNamespace: ctrl.project.metadata.namespace,
                                functionData: newFunction
                            });
                        } else {
                            ctrl.nameTakenError = true;
                        }
                    });
                }
            }
        }

        /**
         * Sets new data from input field as a name of the duplicated function
         * @param {string} newData - new string value which should be set
         */
        function inputValueCallback(newData) {
            ctrl.newFunctionName = newData;
        }

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.closeDialog();
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('nclFunction', {
        bindings: {},
        templateUrl: 'nuclio/projects/project/functions/function/ncl-function.tpl.html',
        controller: NclFunctionController
    });

    function NclFunctionController() {
        var ctrl = this;
    }
})();
'use strict';

(function () {
    'use strict';

    NclFunctionCollapsingRowController.$inject = ['$state', '$interval', '$i18next', 'i18next', 'lodash', 'ngDialog', 'ConfigService', 'DialogsService', 'ExportService', 'NuclioHeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionCollapsingRow', {
        bindings: {
            actionHandlerCallback: '&',
            externalAddress: '<',
            function: '<',
            functionsList: '<',
            getFunction: '&',
            getFunctions: '&',
            handleDeleteFunction: '&',
            isSplashShowed: '<',
            onUpdateFunction: '&',
            project: '<',
            refreshFunctionsList: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-collapsing-row.tpl.html',
        controller: NclFunctionCollapsingRowController
    });

    function NclFunctionCollapsingRowController($state, $interval, $i18next, i18next, lodash, ngDialog, ConfigService, DialogsService, ExportService, NuclioHeaderService) {
        var ctrl = this;
        var tempFunctionCopy = null;
        var interval = null;
        var lng = i18next.language;

        ctrl.actions = [];
        ctrl.isCollapsed = true;
        ctrl.title = null;
        ctrl.invocationURL = '';
        ctrl.runtimes = {
            'golang': 'Go',
            'python:2.7': 'Python 2.7',
            'python:3.6': 'Python 3.6',
            'dotnetcore': '.NET Core',
            'java': 'Java',
            'nodejs': 'NodeJS',
            'shell': 'Shell',
            'ruby': 'Ruby'
        };

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.statusIcon = null;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;
        ctrl.$onChanges = onChanges;

        ctrl.isFunctionShowed = isFunctionShowed;
        ctrl.getTooltip = getTooltip;
        ctrl.handleAction = handleAction;
        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.toggleFunctionState = toggleFunctionState;
        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.title = {
                project: ctrl.project,
                function: ctrl.function.metadata.name
            };

            lodash.defaultsDeep(ctrl.function, {
                ui: {
                    delete: deleteFunction,
                    duplicate: duplicateFunction,
                    export: exportFunction,
                    viewConfig: viewConfig
                }
            });

            ctrl.actions = initActions();
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            terminateInterval();
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'function')) {
                convertStatusState();
                setStatusIcon();

                ctrl.invocationURL = lodash.isNil(ctrl.function.status.httpPort) ? $i18next.t('functions:NOT_YET_DEPLOYED', { lng: lng }) : lodash.isEmpty(ctrl.externalAddress) ? 'N/A' : 'http://' + ctrl.externalAddress + ':' + ctrl.function.status.httpPort;
            }
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType
         * @param {Array} checkedItems
         * @returns {Promise}
         */
        function handleAction(actionType, checkedItems) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: checkedItems });
        }

        /**
         * Determines whether the current layer is showed
         * @returns {boolean}
         */
        function isFunctionShowed() {
            return ctrl.function.ui.isShowed;
        }

        /**
         * Returns appropriate tooltip for functions status.
         * @returns {string} - tooltip
         */
        function getTooltip() {
            return ctrl.function.spec.disable ? $i18next.t('functions:TOOLTIP.RUN_FUNCTION', { lng: lng }) : $i18next.t('functions:TOOLTIP.STOP_FUNCTION', { lng: lng });
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.function] });
        }

        //
        // Private methods
        //

        /**
         * Converts function status state.
         */
        function convertStatusState() {
            var status = lodash.chain(ctrl.function.status.state).lowerCase().upperFirst().value();

            ctrl.convertedStatusState = status === 'Error' ? 'Error' : status === 'Scaled to zero' ? 'Scaled to zero' : status === 'Ready' && ctrl.function.spec.disable ? 'Standby' : status === 'Ready' && !ctrl.function.spec.disable ? 'Running' :
            /* else */'Building';
        }

        /**
         * Disables function.
         * Sends request to change `spec.disable` property
         */
        function disableFunction() {

            // in case failed request, modified function object will be restored from that copy
            tempFunctionCopy = lodash.cloneDeep(ctrl.function);

            var propertiesToDisableFunction = {
                spec: {
                    disable: true,
                    build: {
                        mode: 'neverBuild'
                    }
                }
            };

            lodash.merge(ctrl.function, propertiesToDisableFunction);

            updateFunction('Disabling…');
        }

        function duplicateFunction() {
            ngDialog.open({
                template: '<ncl-duplicate-function-dialog data-close-dialog="closeThisDialog()" ' + 'data-get-functions="ngDialogData.getFunctions({id: id})" ' + 'data-project="ngDialogData.project" data-version="ngDialogData.version">' + '</ncl-duplicate-function-dialog>',
                plain: true,
                data: {
                    getFunctions: ctrl.getFunctions,
                    project: ctrl.project,
                    version: ctrl.function
                },
                className: 'ngdialog-theme-iguazio duplicate-function-dialog-wrapper'
            });
        }

        /**
         * Enables function.
         * Sends request to change `spec.disable` property
         */
        function enableFunction() {

            // in case failed request, modified function object will be restored from that copy
            tempFunctionCopy = lodash.cloneDeep(ctrl.function);

            var propertiesToEnableFunction = {
                spec: {
                    disable: false,
                    build: {
                        mode: 'neverBuild'
                    }
                }
            };

            lodash.merge(ctrl.function, propertiesToEnableFunction);

            updateFunction('Enabling…');
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [{
                label: $i18next.t('common:DELETE', { lng: lng }),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('functions:DELETE_FUNCTION', { lng: lng }) + ' “' + ctrl.function.metadata.name + '”?',
                    description: $i18next.t('functions:DELETED_FUNCTION_DESCRIPTION', { lng: lng }),
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'nuclio_alert'
                }
            }, {
                label: $i18next.t('common:DUPLICATE', { lng: lng }),
                id: 'duplicate',
                icon: 'igz-icon-duplicate',
                active: true
            }, {
                label: $i18next.t('common:EXPORT', { lng: lng }),
                id: 'export',
                icon: 'igz-icon-export-yml',
                active: true
            }, {
                label: $i18next.t('functions:VIEW_YAML', { lng: lng }),
                id: 'viewConfig',
                icon: 'igz-icon-view-file',
                active: true
            }];
        }

        /**
         * Deletes function from functions list
         * @returns {Promise}
         */
        function deleteFunction() {
            ctrl.isSplashShowed.value = true;

            return ctrl.handleDeleteFunction({ functionData: ctrl.function.metadata }).then(function () {
                lodash.remove(ctrl.functionsList, ['metadata.name', ctrl.function.metadata.name]);
            }).catch(function (error) {
                ctrl.isSplashShowed.value = false;
                var msg = $i18next.t('functions:ERROR_MSG.DELETE_FUNCTION.DEFAULT', { lng: lng });

                return DialogsService.alert(lodash.get(error, 'data.error', msg));
            });
        }

        /**
         * Exports the function
         */
        function exportFunction() {
            ExportService.exportFunction(ctrl.function);
        }

        /**
         * Handles mouse click on a table row and navigates to Code page of latest version
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (!angular.isString(state)) {
                state = 'app.project.function.edit.code';
            }

            event.preventDefault();
            event.stopPropagation();

            $state.go(state, {
                id: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });

            NuclioHeaderService.updateMainHeader('common:PROJECTS', ctrl.title, $state.current.name);
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'.
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function pullFunctionState(status) {
            ctrl.convertedStatusState = lodash.defaultTo(status, 'Building');
            setStatusIcon();

            interval = $interval(function () {
                ctrl.getFunction({ metadata: ctrl.function.metadata, projectID: ctrl.project.metadata.name }).then(function (response) {
                    if (response.status.state === 'ready' || response.status.state === 'error') {
                        terminateInterval();
                        convertStatusState();
                        setStatusIcon();
                    }
                }).catch(function (error) {
                    var msg = $i18next.t('functions:ERROR_MSG.GET_FUNCTION.DEFAULT', { lng: lng });

                    terminateInterval();
                    convertStatusState();
                    setStatusIcon();

                    return DialogsService.alert(lodash.get(error, 'data.error', msg));
                });
            }, 2000);
        }

        /**
         * Returns appropriate css icon class for functions status.
         * @returns {string} - icon class
         */
        function setStatusIcon() {
            ctrl.statusIcon = ctrl.convertedStatusState === 'Running' ? 'igz-icon-pause' : ctrl.convertedStatusState === 'Standby' ? 'igz-icon-play' :
            /* else */'';
        }

        /**
         * Terminates the interval of function state polling.
         */
        function terminateInterval() {
            if (!lodash.isNil(interval)) {
                $interval.cancel(interval);
                interval = null;
            }
        }

        /**
         * Toggles function 'disabled' property and updates it on back-end
         * @param {MouseEvent} event
         */
        function toggleFunctionState(event) {
            event.preventDefault();
            event.stopPropagation();

            if (ctrl.function.spec.disable) {
                enableFunction();
            } else {
                disableFunction();
            }
        }

        /**
         * Show dialog with YAML function config
         */
        function viewConfig() {
            ngDialog.open({
                template: '<ncl-function-config-dialog data-close-dialog="closeThisDialog()" ' + '                            data-function="ngDialogData.function">' + '</ncl-function-config-dialog>',
                plain: true,
                data: {
                    function: ctrl.function
                },
                className: 'ngdialog-theme-iguazio view-yaml-dialog-wrapper'
            });
        }

        /**
         * Sends request to update function state
         * @param {string} [status='Building'] - The text to display in "Status" cell of the function while polling.
         */
        function updateFunction(status) {
            ctrl.isSplashShowed.value = true;

            var pathsToExcludeOnDeploy = ['status', 'ui', 'versions'];
            var functionCopy = lodash.omit(ctrl.function, pathsToExcludeOnDeploy);

            // set `nuclio.io/project-name` label to relate this function to its project
            lodash.set(functionCopy, ['metadata', 'labels', 'nuclio.io/project-name'], ctrl.project.metadata.name);

            ctrl.onUpdateFunction({ 'function': functionCopy, projectID: ctrl.project.metadata.name }).then(function () {
                tempFunctionCopy = null;

                pullFunctionState(status);
            }).catch(function (error) {
                ctrl.function = tempFunctionCopy;

                var msg = $i18next.t('functions:ERROR_MSG.UPDATE_FUNCTION.DEFAULT', { lng: lng });

                return DialogsService.alert(lodash.get(error, 'data.error', msg));
            }).finally(function () {
                ctrl.isSplashShowed.value = false;
            });
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    NclVersionController.$inject = ['$interval', '$scope', '$rootScope', '$state', '$stateParams', '$transitions', '$timeout', '$i18next', 'i18next', 'lodash', 'ngDialog', 'ConfigService', 'DialogsService', 'ExportService', 'NuclioHeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclVersion', {
        bindings: {
            project: '<',
            version: '<',
            createVersion: '&',
            deleteFunction: '&',
            getProject: '&',
            getFunction: '&',
            getFunctions: '&',
            getExternalIpAddresses: '&',
            getFrontendSpec: '&',
            onEditCallback: '&?',
            updateVersion: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version.tpl.html',
        controller: NclVersionController
    });

    function NclVersionController($interval, $scope, $rootScope, $state, $stateParams, $transitions, $timeout, $i18next, i18next, lodash, ngDialog, ConfigService, DialogsService, ExportService, NuclioHeaderService) {
        var ctrl = this;
        var deregisterFunction = null;
        var interval = null;
        var ingressHostTemplate = '';
        var lng = i18next.language;

        ctrl.action = null;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.deployResult = {};
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.rowIsCollapsed = {
            statusCode: false,
            headers: false,
            body: false,
            deployBlock: false
        };

        ctrl.isDeployDisabled = false;
        ctrl.isLayoutCollapsed = true;

        ctrl.$onDestroy = onDestroy;
        ctrl.$onInit = onInit;

        ctrl.deployButtonClick = deployButtonClick;
        ctrl.getCurrentStateName = getCurrentStateName;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.isInValidDeployState = isInValidDeployState;
        ctrl.onRowCollapse = onRowCollapse;
        ctrl.onSelectAction = onSelectAction;
        ctrl.toggleDeployResult = toggleDeployResult;

        //
        // Hook method
        //

        /**
         * Destructor method
         */
        function onDestroy() {
            terminateInterval();
        }

        /**
         * Initialization method
         */
        function onInit() {
            setDeployResult(lodash.get(ctrl.version, 'status.state', 'ready'));

            ctrl.isFunctionDeployed = !$stateParams.isNewFunction;
            ctrl.actions = [{
                id: 'exportFunction',
                name: $i18next.t('functions:EXPORT_FUNCTION', { lng: lng })
            }, {
                id: 'deleteFunction',
                name: $i18next.t('functions:DELETE_FUNCTION', { lng: lng }),
                dialog: {
                    message: {
                        message: $i18next.t('functions:DELETE_FUNCTION', { lng: lng }) + ' “' + ctrl.version.metadata.name + '”?',
                        description: $i18next.t('functions:DELETED_FUNCTION_DESCRIPTION', { lng: lng })
                    },
                    yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                    noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                    type: 'nuclio_alert'
                }
            }, {
                id: 'duplicateFunction',
                name: $i18next.t('functions:DUPLICATE_FUNCTION', { lng: lng })
            }, {
                id: 'viewConfig',
                name: $i18next.t('functions:VIEW_YAML', { lng: lng })
            }];

            ctrl.navigationTabsConfig = [{
                tabName: $i18next.t('common:CODE', { lng: lng }),
                id: 'code',
                uiRoute: 'app.project.function.edit.code'
            }, {
                tabName: $i18next.t('common:CONFIGURATION', { lng: lng }),
                id: 'configuration',
                uiRoute: 'app.project.function.edit.configuration'
            }, {
                tabName: $i18next.t('common:TRIGGERS', { lng: lng }),
                id: 'triggers',
                uiRoute: 'app.project.function.edit.triggers'
            }, {
                tabName: $i18next.t('common:STATUS', { lng: lng }),
                id: 'status',
                uiRoute: 'app.project.function.edit.monitoring',
                status: isVersionDeployed() ? lodash.get(ctrl.version, 'status.state') : 'not yet deployed'
            }];

            ctrl.requiredComponents = {};

            ctrl.getProject({ id: $stateParams.projectId }).then(function (response) {

                // set projects data
                ctrl.project = response;

                // breadcrumbs config
                var title = {
                    project: ctrl.project,
                    function: $stateParams.functionId,
                    version: '$LATEST'
                };

                NuclioHeaderService.updateMainHeader('common:PROJECTS', title, $state.current.name);
            }).then(setIngressHost).catch(function (error) {
                var msg = $i18next.t('functions:ERROR_MSG.GET_PROJECT', { lng: lng });
                DialogsService.alert(lodash.get(error, 'data.error', msg));
            });

            $scope.$on('change-state-deploy-button', changeStateDeployButton);

            deregisterFunction = $transitions.onStart({}, stateChangeStart);

            if (ctrl.isInValidDeployState()) {
                ctrl.isFunctionDeployed = false;
                ctrl.isDeployResultShown = true;
                ctrl.rowIsCollapsed.deployBlock = true;

                pullFunctionState();
            }

            ctrl.isLayoutCollapsed = true;

            lodash.defaultsDeep(ctrl.version, {
                spec: {
                    build: {
                        image: '',
                        noCache: false,
                        offline: false,
                        dependencies: [],
                        runtimeAttributes: {
                            repositories: []
                        }
                    }
                },
                ui: {
                    versionCode: ''
                }
            });

            lodash.merge(ctrl.version, {
                ui: {
                    deployedVersion: isVersionDeployed() ? getVersionCopy() : null,
                    versionChanged: false
                }
            });

            ctrl.getFrontendSpec().then(setInvocationUrl).then(setIngressHost).catch(function () {
                ctrl.version.ui.invocationURL = '';
            });
        }

        //
        // Public methods
        //

        /**
         * Deploys changed version
         * @param {MouseEvent} event
         */
        function deployButtonClick(event) {
            if (!ctrl.isDeployDisabled) {
                ctrl.isFunctionDeployed = false;
                $rootScope.$broadcast('deploy-function-version', { event: event });

                var versionCopy = lodash.omit(ctrl.version, ['status', 'ui']);

                // set `nuclio.io/project-name` label to relate this function to its project
                lodash.set(versionCopy, ['metadata', 'labels', 'nuclio.io/project-name'], ctrl.project.metadata.name);
                lodash.set(versionCopy, 'spec.build.mode', 'alwaysBuild');

                ctrl.isTestResultShown = false;
                ctrl.isDeployResultShown = false;
                ctrl.rowIsCollapsed.deployBlock = true;
                ctrl.isLayoutCollapsed = false;

                $timeout(function () {
                    $rootScope.$broadcast('igzWatchWindowResize::resize');
                });

                ctrl.isSplashShowed.value = true;
                var method = isVersionDeployed() ? ctrl.updateVersion : ctrl.createVersion;
                method({ version: versionCopy, projectID: ctrl.project.metadata.name }).then(pullFunctionState).catch(function (error) {
                    var status = lodash.get(error, 'status');

                    var msg = status === 403 ? $i18next.t('functions:ERROR_MSG.DEPLOY_FUNCTION.403', { lng: lng }) : status === 405 ? $i18next.t('functions:ERROR_MSG.DEPLOY_FUNCTION.405', { lng: lng }) : status === 409 ? $i18next.t('functions:ERROR_MSG.DEPLOY_FUNCTION.409', { lng: lng }) :
                    /* else */$i18next.t('common:ERROR_MSG.UNKNOWN_ERROR', { lng: lng });
                    DialogsService.alert(msg);
                }).finally(function () {
                    ctrl.isSplashShowed.value = false;
                });
            }
        }

        function getCurrentStateName() {
            return $state.current.name;
        }

        /**
         * Gets current status state
         * @param {string} state
         * @returns {string}
         */
        function getDeployStatusState(state) {
            return state === 'ready' ? $i18next.t('functions:SUCCESSFULLY_DEPLOYED', { lng: lng }) : state === 'error' ? $i18next.t('functions:FAILED_TO_DEPLOY', { lng: lng }) :
            /* else */$i18next.t('functions:DEPLOYING', { lng: lng });
        }

        /**
         * Checks if state of deploy is valid
         * @returns {boolean}
         */
        function isInValidDeployState() {
            var validStates = ['building', 'waitingForResourceConfiguration', 'waitingForBuild', 'configuringResources'];

            return lodash.includes(validStates, ctrl.deployResult.status.state);
        }

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            }, 350);
        }

        /**
         * Called when action is selected
         * @param {Object} item - selected action
         */
        function onSelectAction(item) {
            if (item.id === 'deleteFunction') {
                DialogsService.confirm(item.dialog.message, item.dialog.yesLabel, item.dialog.noLabel, item.dialog.type).then(function () {
                    ctrl.isSplashShowed.value = true;

                    ctrl.deleteFunction({ functionData: ctrl.version.metadata }).then(function () {
                        $state.go('app.project.functions');
                    }).catch(function (error) {
                        ctrl.isSplashShowed.value = false;
                        var msg = $i18next.t('functions:ERROR_MSG.DELETE_FUNCTION.DEFAULT', { lng: lng });
                        DialogsService.alert(lodash.get(error, 'data.error', msg));
                    });
                });
            } else if (item.id === 'exportFunction') {
                ExportService.exportFunction(ctrl.version);
            } else if (item.id === 'viewConfig') {
                ngDialog.open({
                    template: '<ncl-function-config-dialog data-close-dialog="closeThisDialog()" ' + 'data-function="ngDialogData.function"></ncl-function-config-dialog>',
                    plain: true,
                    data: {
                        function: ctrl.version
                    },
                    className: 'ngdialog-theme-iguazio view-yaml-dialog-wrapper'
                });
            } else if (item.id === 'duplicateFunction') {
                ngDialog.open({
                    template: '<ncl-duplicate-function-dialog data-close-dialog="closeThisDialog()" ' + 'data-get-functions="ngDialogData.getFunctions({id: id})" ' + 'data-project="ngDialogData.project" data-version="ngDialogData.version">' + '</ncl-duplicate-function-dialog>',
                    plain: true,
                    data: {
                        getFunctions: ctrl.getFunctions,
                        project: ctrl.project,
                        version: ctrl.version
                    },
                    className: 'ngdialog-theme-iguazio duplicate-function-dialog-wrapper'
                });
            }
        }

        /**
         * Shows/hides deploy version result
         */
        function toggleDeployResult() {
            ctrl.isDeployResultShown = !ctrl.isDeployResultShown;

            $timeout(function () {
                $rootScope.$broadcast('igzWatchWindowResize::resize');
            });
        }

        //
        // Private methods
        //

        /**
         * Disable deploy button if forms invalid
         * @param {Object} event
         * @param {Object} args
         * @param {string} args.component
         * @param {boolean} args.isDisabled
         */
        function changeStateDeployButton(event, args) {
            if (lodash.isString(args.component)) {
                ctrl.requiredComponents[args.component] = args.isDisabled;

                // disable the "Deploy" button if at least one component is invalid
                // enable the "Deploy" button if all components are valid
                ctrl.isDeployDisabled = lodash.some(ctrl.requiredComponents);
            } else {
                ctrl.isDeployDisabled = args.isDisabled;
            }
        }

        /**
         * Gets copy of ctrl.version without `ui` property
         */
        function getVersionCopy() {
            return angular.copy(lodash.omit(ctrl.version, 'ui'));
        }

        /**
         * Tests whether the version is deployed.
         * @returns {boolean} `true` in case version is deployed, or `false` otherwise.
         */
        function isVersionDeployed() {
            return lodash.isObject(ctrl.version.status) && !lodash.isEmpty(ctrl.version.status);
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'
         */
        function pullFunctionState() {
            ctrl.isDeployResultShown = true;
            setDeployResult('building');

            interval = $interval(function () {
                ctrl.getFunction({ metadata: ctrl.version.metadata, projectID: lodash.get(ctrl.project, 'metadata.name') }).then(function (response) {
                    if (response.status.state === 'ready' || response.status.state === 'error') {
                        terminateInterval();

                        ctrl.versionDeployed = true;

                        if (!isVersionDeployed()) {
                            ctrl.version.status = response.status;
                        }
                        ctrl.version.ui = {
                            deployedVersion: getVersionCopy(),
                            versionChanged: false
                        };

                        lodash.assign(ctrl.version.spec, response.spec);

                        ctrl.getFrontendSpec().then(setInvocationUrl).then(setIngressHost).catch(function () {
                            ctrl.version.ui.invocationURL = '';
                        });

                        ctrl.isFunctionDeployed = true;
                    }

                    ctrl.version.ui.deployResult = response;

                    ctrl.deployResult = response;

                    $rootScope.$broadcast('deploy-result-changed');

                    lodash.set(lodash.find(ctrl.navigationTabsConfig, 'status'), 'status', response.status.state);

                    $timeout(function () {
                        angular.element('.log-panel').mCustomScrollbar('scrollTo', 'bottom');
                    });
                }).catch(function (error) {
                    if (error.status !== 404) {
                        ctrl.isSplashShowed.value = false;
                    }
                });
            }, 2000);
        }

        /**
         * Sets deploying results
         * @param {string} value
         */
        function setDeployResult(value) {
            ctrl.deployResult = {
                status: {
                    state: value
                }
            };
            lodash.set(lodash.find(ctrl.navigationTabsConfig, 'status'), 'status', value);
        }

        /**
         * Sets the invocation URL of the function
         * @param {{externalIPAddresses: Array.<string>, defaultHTTPIngressHostTemplate: <string>,
         * namespace: <string>}} result - the response body from`getFrontendSpec`
         */
        function setInvocationUrl(result) {
            var ip = lodash.get(result, 'externalIPAddresses[0]', '');
            var port = lodash.defaultTo(lodash.get(ctrl.version, 'ui.deployResult.status.httpPort'), lodash.get(ctrl.version, 'status.httpPort'));

            ctrl.version.ui.invocationURL = lodash.isEmpty(ip) || !lodash.isNumber(port) ? '' : 'http://' + ip + ':' + port;

            ingressHostTemplate = lodash.get(result, 'defaultHTTPIngressHostTemplate', '');
        }

        /**
         * Sets ingress host based on template
         */
        function setIngressHost() {
            var matches = {
                '{{ .FunctionName }}': lodash.get(ctrl.version, 'metadata.name'),
                '{{ .ProjectName }}': lodash.get(ctrl.project, 'metadata.name'),
                '{{ .Namespace }}': lodash.get(ctrl.project, 'metadata.namespace')
            };

            ctrl.version.ui.ingressHost = lodash.reduce(matches, function (accum, value, key) {
                return !lodash.isNil(value) ? lodash.replace(accum, key, value) : accum;
            }, ingressHostTemplate);
        }

        /**
         * Prevents change state if there are unsaved data
         * @param {Event} transition
         */
        function stateChangeStart(transition) {
            var toState = transition.$to();
            if (lodash.get($state, 'params.functionId') !== transition.params('to').functionId && !isVersionDeployed()) {
                transition.abort();
                DialogsService.confirm($i18next.t('common:LEAVE_PAGE_CONFIRM', { lng: lng }), $i18next.t('common:LEAVE', { lng: lng }), $i18next.t('common:DONT_LEAVE', { lng: lng })).then(function () {

                    // unsubscribe from broadcast event
                    deregisterFunction();
                    $state.go(toState.name, transition.params('to'));
                });
            }
        }

        /**
         * Terminates the interval of function state polling.
         */
        function terminateInterval() {
            if (!lodash.isNil(interval)) {
                $interval.cancel(interval);
                interval = null;
            }
        }
    }
})();
(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/projects.tpl.html',
    '<section class="igz-general-content" data-igz-extend-background><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><igz-info-page-actions-bar class="igz-component"><div class="actions-bar-left"><igz-action-panel data-actions="$ctrl.actions"></igz-action-panel></div><div class="actions-bar-right"><button class="project-import-input" ngf-select="$ctrl.importProject($file)" accept=".yml, .yaml"></button><div class="actions-bar-left actions-buttons-block"><igz-default-dropdown data-select-property-only="id" data-placeholder="{{ \'functions:PLACEHOLDER.ACTIONS\' | i18next }}" data-values-array="$ctrl.dropdownActions" data-item-select-callback="$ctrl.onSelectDropdownAction(item)" data-skip-selection="true"></igz-default-dropdown><button class="ncl-new-entity-button" data-ng-click="$ctrl.openNewProjectDialog()">{{ \'functions:CREATE_PROJECT\' | i18next }}</button><button class="ncl-new-entity-button" data-ng-click="$ctrl.createFunction()">{{ \'functions:CREATE_FUNCTION\' | i18next }}</button></div><div class="actions-bar-left actions-content-block"><div class="igz-action-panel"><div class="actions-list"><igz-action-item-refresh data-refresh="$ctrl.refreshProjects()"></igz-action-item-refresh><igz-sort-dropdown class="igz-component pull-left" data-sort-options="$ctrl.sortOptions" data-reverse-sorting="$ctrl.isReverseSorting" data-update-data-callback="$ctrl.onSortOptionsChange" data-uib-tooltip="{{ \'common:TOOLTIP.SORT\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="top"></igz-sort-dropdown></div></div></div><igz-actions-panes data-filters-toggle-method="$ctrl.toggleFilters()" data-show-filter-icon="true" data-filters-counter="$ctrl.filtersCounter" data-is-filters-opened="$ctrl.isFiltersShowed.value"></igz-actions-panes></div></igz-info-page-actions-bar><igz-info-page-content class="igz-component"><div id="nuclio-projects-page" class="projects nuclio-projects-page"><div class="nuclio-table common-table"><div class="common-table-header"><igz-action-checkbox-all class="common-table-cell check-all-rows" data-items-count="$ctrl.projects.length"></igz-action-checkbox-all><div class="igz-row common-table-cells-container"><div class="igz-col-25 common-table-cell sortable name" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.displayName\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.displayName\')">{{ \'common:NAME\' | i18next }}<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.name"></div></div><div class="igz-col-{{$ctrl.isDemoMode() ? \'25\' : \'75\'}} common-table-cell sortable description" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.description\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.description\')">{{ \'common:DESCRIPTION\' | i18next }}<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.description"></div></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell sortable created-by" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.created_by\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.created_by\')">{{ \'common:CREATED_BY\' | i18next }}<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.created-by"></div></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell sortable created-date" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.created_date\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.created_date\')">{{ \'functions:CREATED_DATE\' | i18next }}<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.created-date"></div></div></div><div class="common-table-cell actions-menu"></div></div><div class="search-input-not-found" data-ng-if="$ctrl.isProjectsListEmpty()">{{ \'functions:PROJECTS_NOT_FOUND\' | i18next }}</div><div data-igz-extend-background class="common-table-body"><div class="igz-scrollable-container" data-ng-scrollbars data-ng-hide="$ctrl.searchStates.searchNotFound && $ctrl.searchStates.searchInProgress"><div data-ng-repeat="project in $ctrl.projects track by project.metadata.name"><div data-igz-show-hide-search-item="project"><ncl-projects-table-row data-igz-resizable-row-cells data-project="project" data-projects-list="$ctrl.projects" data-delete-project="$ctrl.deleteProject({project: project})" data-update-project="$ctrl.updateProject({project: project})" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItems)" data-get-functions="$ctrl.getFunctions({id: id})"></ncl-projects-table-row></div></div></div></div></div></div></igz-info-page-content><igz-info-page-filters data-is-filters-showed="$ctrl.isFiltersShowed.value" data-apply-filters="$ctrl.onApplyFilters(false)" data-reset-filters="$ctrl.onResetFilters(false)" data-change-state-callback="$ctrl.isFiltersShowed.changeValue(newVal)" data-toggle-method="$ctrl.toggleFilters()"><igz-search-input class="info-page-filters-item igz-component" data-data-set="$ctrl.projects" data-search-keys="$ctrl.searchKeys" data-search-callback="$ctrl.onUpdateFiltersCounter(searchQuery)" data-placeholder="{{ \'functions:PLACEHOLDER.SEARCH_PROJECTS\' | i18next }}" data-live-search="false" data-search-states="$ctrl.searchStates"></igz-search-input></igz-info-page-filters></section>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-checkbox/action-checkbox.tpl.html',
    '<div class="action-checkbox"><div class="check-item igz-icon-checkbox-unchecked" data-ng-class="{\'igz-icon-checkbox-checked\': $ctrl.item.ui.checked}" data-ng-click="$ctrl.onCheck($event)" data-ng-dblclick="$event.stopPropagation()"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-item/action-item.tpl.html',
    '<div class="igz-action-item" data-ng-class="{\'inactive\': !$ctrl.action.active,\n' +
    '     \'subtemplate-show\': $ctrl.action.subTemplateProps.isShown,\n' +
    '     \'ng-hide\': !$ctrl.isItemVisible($ctrl.action),\n' +
    '     \'divider\': $ctrl.action.id === \'divider\'}" data-ng-click="$ctrl.onClickAction($event)" data-ng-if="$ctrl.template !== \'additional\'" data-uib-tooltip="{{$ctrl.action.label}}" data-tooltip-popup-delay="1000" data-tooltip-placement="bottom" data-tooltip-append-to-body="true"><div data-ng-if="$ctrl.action.id === \'upload\'" class="upload-action" data-ngf-select data-ngf-multiple="true" data-ngf-change="$ctrl.onFilesDropped($files)"><div class="action-icon {{$ctrl.action.icon}}"></div><div class="action-label">{{$ctrl.action.label}}</div></div><div data-ng-if="$ctrl.action.id !== \'upload\'"><div class="action-icon {{$ctrl.action.icon}}" data-ng-style="$ctrl.action.iconColor && {\'color\': $ctrl.action.iconColor}"></div><div class="action-label">{{$ctrl.action.label}}</div><igz-action-item-subtemplate class="action-subtemplate igz-component" data-ng-if="$ctrl.action.template" data-ng-show="$ctrl.action.subTemplateProps.isShown" action="$ctrl.action" data-ng-click="$event.stopPropagation()"></igz-action-item-subtemplate></div></div><li data-ng-if="$ctrl.template === \'additional\'" data-ng-click="$ctrl.onClickAction($event)"><div class="action-icon {{$ctrl.action.icon}}" data-ng-style="$ctrl.action.iconColor && {\'color\': $ctrl.action.iconColor}"></div><div class="action-label">{{$ctrl.action.label}}</div><igz-action-item-subtemplate class="action-subtemplate igz-component" data-ng-if="$ctrl.action.template" data-ng-show="$ctrl.action.subTemplateProps.isShown" action="$ctrl.action" data-ng-click="$event.stopPropagation()"></igz-action-item-subtemplate></li>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-checkbox-all/action-checkbox-all.tpl.html',
    '<div class="action-checkbox-all"><div class="check-item" data-ng-class="{\'igz-icon-checkbox-checked\': $ctrl.allItemsChecked,\n' +
    '                        \'igz-icon-checkbox-checked-few\': $ctrl.checkedItemsCount > 0 && !$ctrl.allItemsChecked,\n' +
    '                        \'igz-icon-checkbox-unchecked\': $ctrl.checkedItemsCount === 0}" data-ng-click="$ctrl.onCheckAll()"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-menu/action-menu.tpl.html',
    '<div class="igz-action-menu" data-ng-if="$ctrl.isVisible()"><div class="menu-button {{$ctrl.iconClass}}" data-ng-class="{active: $ctrl.isMenuShown}" data-ng-click="$ctrl.toggleMenu($event)"></div><div class="menu-dropdown" data-ng-if="$ctrl.isMenuShown"><div class="actions-list" data-ng-click="$ctrl.toggleMenu($event)"><igz-action-item data-ng-repeat="action in $ctrl.actions track by action.id" data-action="action"></igz-action-item></div><div class="shortcuts-list" data-ng-if="$ctrl.shortcuts && $ctrl.shortcuts.length > 0" data-ng-class="{\'first-block\': $ctrl.actions.length === 0}"><div class="shortcuts-header">{{ \'common:SHORTCUTS\' | i18next }}</div><div class="shortcuts-item" data-ng-repeat="shortcut in $ctrl.shortcuts" data-ng-click="$ctrl.showDetails($event, shortcut.state)">{{shortcut.label}}</div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-panel/action-panel.tpl.html',
    '<div class="igz-action-panel" data-igz-right-click data-ng-show="$ctrl.isActionPanelShown()"><div class="actions-list clearfix" data-ng-show="$ctrl.mainActions.length > 0 || $ctrl.remainingActions.length > 0"><igz-action-item data-ng-repeat="action in $ctrl.mainActions" data-action="action"></igz-action-item><igz-action-item-more data-ng-if="$ctrl.remainingActions.length !== 0" data-actions="$ctrl.remainingActions"><div class="transclude-container" data-ng-transclude></div></igz-action-item-more></div><div class="actions-list empty" data-ng-show="$ctrl.mainActions.length === 0 && $ctrl.remainingActions.length === 0">{{ \'common:NO_ACTIONS\' | i18next }}</div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/actions-panes/actions-panes.tpl.html',
    '<div class="actions-bar-left actions-panes-block"><div class="igz-action-panel"><div class="actions-list"><div class="igz-action-item" data-ng-class="{active: $ctrl.isFiltersOpened}" data-ng-if="$ctrl.isShowFilterActionIcon()" data-uib-tooltip="{{ \'common:FILTER\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.filtersToggleMethod()"><div class="action-icon igz-icon-filter"></div><span data-ng-if="$ctrl.filtersCounter" class="filter-counter">{{$ctrl.filtersCounter}}</span></div><div class="igz-action-item last-item" data-ng-class="{inactive: (!$ctrl.isInfoPaneOpened && !$ctrl.infoPaneToggleMethod) || $ctrl.infoPaneDisable,\n' +
    '                                 active: $ctrl.isInfoPaneOpened}" data-ng-if="$ctrl.closeInfoPane || $ctrl.infoPaneToggleMethod" data-uib-tooltip="{{ \'common:INFO_PANE\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.callToggleMethod()"><div class="action-icon igz-icon-info-round"></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/copy-to-clipboard/copy-to-clipboard.tpl.html',
    '<div class="igz-action-item" data-ng-click="$ctrl.copyToClipboard()" data-uib-tooltip="{{ \'common:TOOLTIP.COPY_TO_CLIPBOARD\' | i18next }}" data-tooltip-placement="left" data-tooltip-popup-delay="300" data-tooltip-append-to-body="true"><div class="action-icon ncl-icon-copy"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/default-dropdown/default-dropdown.tpl.html',
    '<div class="default-dropdown" data-ng-class="{\'dropdown-input-invalid\': $ctrl.isShowDropdownError($ctrl.formObject, $ctrl.inputName),\n' +
    '                     \'dropdown-input-disabled\': $ctrl.isDisabled}"><div class="default-dropdown-field" tabindex="0" data-ng-click="$ctrl.readOnly || $ctrl.toggleDropdown($event)" data-ng-keydown="$ctrl.onDropDownKeydown($event)" data-uib-tooltip="{{$ctrl.isDropdownContainerShown ? \'\' : $ctrl.typedValue}}" data-tooltip-append-to-body="true" data-tooltip-placement="top" data-tooltip-popup-delay="300" data-ng-class="{placeholder: $ctrl.isPlaceholderClass(),\n' +
    '                         disabled: $ctrl.isDisabled,\n' +
    '                         readonly: $ctrl.readOnly}"><div class="dropdown-selected-item"><div data-ng-if="$ctrl.showSelectedItem().icon.name" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'priority\'}" class="dropdown-icon {{$ctrl.getIcon($ctrl.showSelectedItem()).name}}"></div><div data-ng-if="$ctrl.showSelectedItem().badge" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'badges-dropdown\'}" class="{{$ctrl.showSelectedItem().badge.class}}">{{$ctrl.showSelectedItem().badge.value}}</div><input type="text" class="input-name text-ellipsis" data-ng-class="{\'non-editable\': !$ctrl.enableTyping && !$ctrl.isDisabled, capitalized: $ctrl.isCapitalized}" data-ng-model="$ctrl.typedValue" data-ng-change="$ctrl.onChangeTypingInput()" data-ng-readonly="!$ctrl.enableTyping" data-ng-required="$ctrl.checkIsRequired()" data-ng-disabled="$ctrl.isDisabled || !$ctrl.enableTyping" data-ng-pattern="$ctrl.matchPattern" name="{{$ctrl.inputName}}" placeholder="{{$ctrl.placeholder}}"><span data-ng-if="$ctrl.getDescription($ctrl.showSelectedItem().description)" class="description">{{$ctrl.getDescription($ctrl.showSelectedItem().description)}}</span></div><div class="dropdown-arrow" data-ng-if="!$ctrl.readOnly"><span class="{{$ctrl.iconClass}}" data-ng-class="{\'rotate-arrow\': $ctrl.isDropUp}"></span></div></div><div class="default-dropdown-container {{$ctrl.additionalClass}}" tabindex="-1" data-ng-if="$ctrl.isDropdownContainerShown" data-ng-style="{\'top\': $ctrl.topPosition}" data-ng-class="{\'dropdown-overlap\': $ctrl.enableOverlap}" data-ng-scrollbars><ul class="list" tabindex="-1"><li class="list-item" tabindex="0" data-ng-repeat="item in $ctrl.getValuesArray() track by $index" data-ng-click="$ctrl.selectItem(item, $event)" data-ng-keydown="$ctrl.onItemKeydown($event, item)" data-ng-class="{\'list-item-description\': $ctrl.getDescription(item),\n' +
    '                                \'active\': $ctrl.isItemSelected(item),\n' +
    '                                \'disabled\': item.disabled}" data-ng-show="item.visible" data-uib-tooltip="{{$ctrl.getTooltip(item)}}" data-tooltip-placement="left" data-tooltip-append-to-body="true"><div class="list-item-block"><div data-ng-if="$ctrl.getIcon(item).name" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'priority\'}" class="dropdown-icon {{$ctrl.getIcon(item).name}}"></div><div data-ng-if="item.badge" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'badges-dropdown\'}" class="{{item.badge.class}}">{{item.badge.value}}</div><div class="list-item-label"><span class="list-item-name" data-ng-class="{\'capitalized\': $ctrl.isCapitalized}">{{$ctrl.getName(item)}}</span><span data-ng-show="$ctrl.getDescription(item)" class="description">{{$ctrl.getDescription(item)}}</span></div></div><div class="igz-col-20 igz-icon-tick selected-item-icon" data-ng-show="$ctrl.isItemSelected(item) && !$ctrl.isPagination"></div></li></ul><div class="add-button-wrapper" tabindex="0" data-ng-if="$ctrl.bottomButtonCallback"><a href="#" class="add-button" data-ng-click="$ctrl.bottomButtonCallback()">{{ $ctrl.bottomButtonText }}</a></div><div class="transclude-container align-items-center" data-ng-if="$ctrl.isTranscludePassed" data-ng-transclude></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/elastic-input-field/elastic-input-field.tpl.html',
    '<div class="igz-elastic-input-field"><div class="non-editable text-ellipsis" data-ng-if="$ctrl.readOnly" data-uib-tooltip="{{$ctrl.model}}" data-tooltip-append-to-body="true" data-tooltip-popup-delay="200">{{$ctrl.model}}</div><div class="editable" data-ng-class="{\n' +
    '         \'elastic-input-invalid\': $ctrl.isShowFieldInvalidState($ctrl.formObject, $ctrl.inputName),\n' +
    '         \'edit-mode\': !$ctrl.readOnly}" data-ng-if="!$ctrl.readOnly"><input name="{{$ctrl.inputName}}" type="text" class="elastic-input" data-ng-model="$ctrl.model" data-ng-model-options="$ctrl.modelOptions" data-ng-maxlength="$ctrl.maxLength" data-ng-minlength="$ctrl.minLength" data-ng-pattern="$ctrl.pattern" data-ng-required="$ctrl.required" data-ng-trim="$ctrl.trim" data-ng-keyup="$ctrl.onDataChange()" placeholder="{{$ctrl.placeholder}}" data-pu-elastic-input data-igz-input-blur-on-enter></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/more-info/more-info.tpl.html',
    '<div class="more-info-wrapper"><div data-ng-if="!$ctrl.isDefaultTooltipEnabled"><div data-ng-class="{\'disabled\': $ctrl.isDisabled, \'click-trigger\': $ctrl.isClickMode()}" data-ng-click="$ctrl.onQuestionMarkClick()" class="question-mark igz-icon-help-round"></div><div class="row-description" data-ng-if="$ctrl.isDescriptionVisible && $ctrl.isHtmlEnabled" data-ng-bind-html="$ctrl.description"></div><div class="row-description" data-ng-if="$ctrl.isDescriptionVisible && !$ctrl.isHtmlEnabled">{{$ctrl.description}}</div></div><div data-ng-if="$ctrl.isDefaultTooltipEnabled"><div data-ng-if="!$ctrl.isHtmlEnabled" class="question-mark igz-icon-help-round" data-ng-class="{\'disabled\': $ctrl.isDisabled}" data-tooltip-class="more-info-tooltip" data-uib-tooltip="{{$ctrl.description}}" data-tooltip-placement="{{$ctrl.defaultTooltipPlacement}}" data-tooltip-popup-delay="{{$ctrl.defaultTooltipPopupDelay}}" data-tooltip-trigger="$ctrl.trigger" data-tooltip-append-to-body="true"></div><div data-ng-if="$ctrl.isHtmlEnabled" class="question-mark igz-icon-help-round" data-ng-class="{\'disabled\': $ctrl.isDisabled}" data-tooltip-class="more-info-tooltip" data-uib-tooltip-html="$ctrl.description" data-tooltip-placement="{{$ctrl.defaultTooltipPlacement}}" data-tooltip-popup-delay="{{$ctrl.defaultTooltipPopupDelay}}" data-tooltip-trigger="$ctrl.trigger" data-tooltip-append-to-body="true"></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/number-input/number-input.tpl.html',
    '<div class="igz-number-input" tabindex="0" data-ng-class="[{\'invalid\': $ctrl.checkInvalidation()},\n' +
    '                    {\'pristine\': !$ctrl.numberInputChanged},\n' +
    '                    {\'disabled\': $ctrl.isDisabled},\n' +
    '                    {\'focused\': $ctrl.inputFocused},\n' +
    '                    {\'submitted\': $ctrl.formObject.$submitted}]"><div class="additional-left-block flex-none"><span class="prefix-unit" data-ng-show="$ctrl.isShownUnit($ctrl.prefixUnit)">{{$ctrl.prefixUnit}}</span></div><input class="input-field additional-right-padding field flex-auto" data-ng-class="{\'additional-left-padding\': $ctrl.isShownUnit($ctrl.prefixUnit)}" type="text" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.currentValue" data-ng-model-options="{allowInvalid: true}" data-money min="{{$ctrl.minValue}}" max="{{$ctrl.maxValue}}" size="1" placeholder="{{$ctrl.placeholder}}" data-precision="{{$ctrl.precision}}" data-ng-focus="$ctrl.setFocus()" data-ng-blur="$ctrl.onBlurInput()" data-ng-change="$ctrl.onChangeInput()" data-ng-disabled="$ctrl.isDisabled" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-igz-validate-elevation data-compare-val="$ctrl.validationValue" data-compare-val-unit="$ctrl.validationValueUnit.power" data-current-val-unit="$ctrl.currentValueUnit.power"><span class="suffix-unit flex-none" data-ng-show="$ctrl.isShownUnit($ctrl.suffixUnit)" data-ng-click="$ctrl.onUnitClick()">{{$ctrl.suffixUnit}}</span><div class="arrow-block flex-none"><span class="igz-icon-dropup" data-ng-click="$ctrl.isDisabled || $ctrl.increaseValue()"></span><span class="igz-icon-dropdown" data-ng-click="$ctrl.isDisabled || $ctrl.decreaseValue()"></span></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/search-input/search-input.tpl.html',
    '<div data-ng-class="{\'search-input\': $ctrl.searchType === \'infoPage\', \'search-input-actions-bar\': $ctrl.searchType === \'actionsBar\'}"><input type="text" class="container-search-input" placeholder="{{$ctrl.placeholder}}" data-ng-focus="$ctrl.toggleInputFocus()" data-ng-blur="$ctrl.toggleInputFocus()" data-ng-keydown="$ctrl.onPressEnter($event)" data-igz-input-blur-on-enter data-ng-model="$ctrl.searchQuery" data-ng-model-options="{ debounce: { \'default\': 500, \'blur\': 0 } }"><span class="igz-icon-search"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.searchQuery" data-ng-click="$ctrl.clearInputField()"></span></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/pagination/pagination.component.tpl.html',
    '<div class="igz-pagination"><div class="rows-title" data-ng-if="!$ctrl.isPerPageVisible">{{ \'common:ROWS_PER_PAGE\' | i18next }}:</div><div class="per-page" data-ng-if="!$ctrl.isPerPageVisible"><igz-default-dropdown data-values-array="$ctrl.perPageValues" data-selected-item="$ctrl.perPage" data-select-property-only="id" data-item-select-callback="$ctrl.onPerPageChanged(item, isItemChanged)" class="per-page-dropdown" data-is-pagination="true"></igz-default-dropdown></div><div class="jump-to-page" data-ng-form="jumpToPageForm" data-ng-if="$ctrl.pageData.total > 1"><div class="to-page-prev igz-button-basic igz-icon-left" tabindex="0" data-uib-tooltip="{{$ctrl.page <= 0 ? \'\' : (\'common:PREVIOUS_PAGE\' | i18next)}}" data-tooltip-placement="top" data-ng-class="{\'disabled\' : $ctrl.page <= 0}" data-ng-click="$ctrl.page <= 0 || $ctrl.goToPrevPage()" data-ng-keydown="$ctrl.goToPrevPage($event)"></div><igz-validating-input-field data-field-type="input" data-input-name="jumpToPage" data-input-value="$ctrl.page + 1" data-is-data-revert="true" data-form-object="jumpToPageForm" data-validation-pattern="$ctrl.jumpToPagePattern" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-item-blur-callback="$ctrl.jumpToPage()" data-validation-is-required="true" data-hide-counter="true" class="jump-to-page-input"></igz-validating-input-field><div class="to-page-next igz-button-basic igz-icon-right" tabindex="0" data-uib-tooltip="{{$ctrl.pageData.total <= $ctrl.page + 1 ? \'\' : (\'common:NEXT_PAGE\' | i18next)}}" data-tooltip-placement="top" data-ng-class="{\'disabled\' : $ctrl.pageData.total <= $ctrl.page + 1}" data-ng-click="($ctrl.pageData.total <= $ctrl.page + 1) || $ctrl.goToNextPage()" data-ng-keydown="$ctrl.goToNextPage($event)"></div><div class="rows-title title">&nbsp;{{ \'common:OF_PAGES\' | i18next:{pagesTotal: $ctrl.pageData.total} }}</div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/slider-input-block/slider-input-block.tpl.html',
    '<div class="igz-slider-input-block clearfix"><div class="igz-slider-input-title igz-col-50"><div class="igz-slider-input-title-text"><i data-ng-if="$ctrl.sliderConfig.iconType" data-ng-class="($ctrl.sliderConfig.iconType | lowercase)"></i>{{$ctrl.sliderConfig.name}}&nbsp;<i data-ng-if="$ctrl.sliderConfig.labelHelpIcon" class="igz-icon-help-round"></i></div></div><div class="igz-col-16"></div><div class="igz-slider-input-current-value igz-col-34" data-ng-class="{\'with-value-unit\': $ctrl.valueUnit,\n' +
    '                         \'with-measure-units\': $ctrl.measureUnits}"><div class="igz-slider-input-current-value-text">{{$ctrl.sliderConfig.valueLabel}}</div></div><div class="igz-slider-input-unit-label" data-ng-if="!$ctrl.measureUnits"><div class="igz-slider-input-current-value-text">{{$ctrl.valueUnit}}</div></div><div class="igz-slider-input-units-dropdown igz-col-16" data-ng-if="$ctrl.measureUnits"><igz-default-dropdown data-values-array="$ctrl.measureUnits" data-selected-item="$ctrl.selectedItem" data-item-select-callback="$ctrl.changeTrafficUnit(item)"></igz-default-dropdown></div><div class="igz-slider-input-rz-slider igz-col-100"><rzslider class="rzslider" data-rz-slider-model="$ctrl.sliderConfig.value" data-rz-slider-options="$ctrl.sliderConfig.options"></rzslider></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/sort-dropdown/sort-dropdown.tpl.html',
    '<div class="igz-custom-dropdown dropdown" data-uib-dropdown data-is-open="$ctrl.isOpen"><div class="igz-action-item" data-ng-class="{\'subtemplate-show\': $ctrl.isOpen}" data-uib-dropdown-toggle><span class="action-icon igz-icon-sort"></span></div><ul class="dropdown-menu dropdown-list" data-ng-if="$ctrl.isOpen"><li class="dropdown-menu-item" data-ng-repeat="option in $ctrl.sortOptions" data-ng-click="$ctrl.toggleSortingOrder(option)"><span class="item-name" data-ng-class="$ctrl.getItemClass(option.active)">{{option.label}}</span><span class="igz-icon-sort-{{$ctrl.reverseSorting ? \'down\' : \'up\'}}" data-ng-show="option.active"></span></li></ul></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/splash-screen/splash-screen.tpl.html',
    '<div class="splash-screen" data-ng-hide="!$ctrl.isSplashShowed.value"><div class="loading-splash-screen" data-ng-if="$ctrl.isLoading"><div class="splash-logo-wrapper"><div class="loader-fading-circle"><div class="loader-circle1 loader-circle"></div><div class="loader-circle2 loader-circle"></div><div class="loader-circle3 loader-circle"></div><div class="loader-circle4 loader-circle"></div><div class="loader-circle5 loader-circle"></div><div class="loader-circle6 loader-circle"></div><div class="loader-circle7 loader-circle"></div><div class="loader-circle8 loader-circle"></div><div class="loader-circle9 loader-circle"></div><div class="loader-circle10 loader-circle"></div><div class="loader-circle11 loader-circle"></div><div class="loader-circle12 loader-circle"></div></div></div><div class="loading-text">{{$ctrl.textToDisplay}}</div></div><div class="alert-splash-screen" data-ng-if="$ctrl.isAlertShowing"><div class="header"></div><div class="notification-text">{{$ctrl.alertText}}</div><div class="buttons"><div class="refresh-button" data-ng-click="$ctrl.refreshPage()"><span class="igz-icon-refresh"></span>{{ \'common:REFRESH\' | i18next }}</div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/validating-input-field/validating-input-field.tpl.html',
    '<div class="validating-input-field" data-ng-class="{\'focused\': $ctrl.inputFocused, \'with-counter\': $ctrl.isCounterVisible()}"><div data-ng-if="$ctrl.fieldType === \'input\'"><div class="input-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="$ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><input class="input-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid(),\n' +
    '                               \'with-icon\': $ctrl.inputIcon}" name="{{$ctrl.inputName}}" placeholder="{{$ctrl.placeholderText}}" data-ng-readonly="$ctrl.readOnly" data-ng-model="$ctrl.data" data-ng-trim="{{$ctrl.trim}}" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-ng-disabled="$ctrl.isDisabled" data-ng-keydown="$ctrl.keyDown($event)" data-igz-input-only-valid-characters="$ctrl.validationPattern" data-only-valid-characters="$ctrl.onlyValidCharacters" spellcheck="{{$ctrl.spellcheck}}" autocomplete="{{$ctrl.autoComplete}}" maxlength="{{$ctrl.onlyValidCharacters ? $ctrl.validationMaxLength : null}}" data-igz-input-blur-on-enter><span data-ng-if="$ctrl.inputIcon" class="input-icon {{$ctrl.inputIcon}}"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.data && $ctrl.isClearIcon" data-ng-click="$ctrl.clearInputField()"></span></div><div data-ng-if="$ctrl.fieldType === \'textarea\'"><div class="textarea-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="$ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><textarea class="textarea-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid()}" name="{{$ctrl.inputName}}" placeholder="{{$ctrl.placeholderText}}" data-ng-model="$ctrl.data" data-ng-required="$ctrl.validationIsRequired" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-ng-disabled="$ctrl.isDisabled" data-ng-readonly="$ctrl.readOnly" spellcheck="{{$ctrl.spellcheck}}">\n' +
    '        </textarea></div><div data-ng-if="$ctrl.fieldType === \'password\'"><input class="input-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid()}" data-igz-validate-password-confirmation="$ctrl.compareInputValue" type="password" name="{{$ctrl.inputName}}" placeholder="{{$ctrl.placeholderText}}" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-ng-disabled="$ctrl.isDisabled" data-ng-readonly="$ctrl.readOnly" data-igz-input-blur-on-enter></div><div data-ng-if="$ctrl.fieldType === \'schedule\'"><cron-selection data-ng-class="{\'invalid\': $ctrl.isFieldValid()}" data-ng-model="$ctrl.data" data-ng-change="$ctrl.updateInputValue()" name="{{$ctrl.inputName}}"></cron-selection></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/edit-project-dialog/edit-project-dialog.tpl.html',
    '<div class="close-button igz-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>{{ \'functions:EDIT_PROJECT\' | i18next }}</span></div><div class="main-content"><form name="editProjectForm" novalidate data-ng-keydown="$ctrl.saveProject($event)"><div class="field-group"><div class="field-label">{{ \'functions:PROJECT_NAME\' | i18next }}</div><div class="field-input"><igz-validating-input-field class="nuclio-validating-input" data-is-disabled="true" data-field-type="input" data-input-name="metadata.name" data-input-value="$ctrl.data.metadata.name" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-form-object="editProjectForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.PROJECT_NAME\' | i18next }}"></igz-validating-input-field></div></div><div class="field-group"><div class="field-label">{{ \'common:DESCRIPTION\' | i18next }}</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(editProjectForm, \'description\')">{{ \'common:ERROR_MSG.INVALID_INPUTS\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="spec.description" data-input-value="$ctrl.data.spec.description" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-form-object="editProjectForm" data-placeholder-text="{{ \'common:DESCRIPTION\' | i18next }}..."></igz-validating-input-field></div></div></form></div><div class="buttons"><button class="ncl-secondary-button" data-test-id="projects.edit-project_cancel.button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">{{ \'common:CANCEL\' | i18next }}</button><button class="ncl-primary-button" data-test-id="projects.edit-project_apply.button" tabindex="0" data-ng-click="$ctrl.saveProject()" data-ng-keydown="$ctrl.saveProject($event)" data-ng-hide="$ctrl.isLoadingState">{{ \'common:APPLY\' | i18next }}</button><button class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">{{ \'common:LOADING_CAPITALIZE_ELLIPSIS\' | i18next }}</button></div><div class="error-text text-centered error-relative" data-ng-show="$ctrl.isServerError()">{{ \'common:ERROR\' | i18next }}:&nbsp;{{$ctrl.serverError}}</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/new-project-dialog/new-project-dialog.tpl.html',
    '<div class="close-button igz-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>{{ \'functions:NEW_PROJECT\' | i18next }}</span></div><div class="main-content"><form name="newProjectForm" novalidate data-ng-keydown="$ctrl.createProject($event)"><div class="field-group"><div class="field-label">{{ \'functions:PROJECT_NAME\' | i18next }}</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(newProjectForm, \'metadata.name\')">{{ \'common:ERROR_MSG.INVALID_INPUTS\' | i18next }}</div><div class="error" data-ng-show="$ctrl.nameTakenError">{{ \'common:ERROR_MSG.NAME_EXISTS\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="metadata.name" data-input-value="$ctrl.data.metadata.name" data-is-focused="true" data-form-object="newProjectForm" data-validation-is-required="true" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-validation-pattern="$ctrl.nameValidationPattern" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_PROJECT_NAME\' | i18next }}" data-uib-tooltip="{{ \'functions:TOOLTIP.PROJECT_FUNCTION_NAME\' | i18next }}" data-tooltip-popup-delay="500" data-tooltip-placement="bottom" data-tooltip-append-to-body="true"></igz-validating-input-field></div></div><div class="field-group"><div class="field-label">{{ \'common:DESCRIPTION\' | i18next }}</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(newProjectForm, \'spec.description\')">{{ \'common:ERROR_MSG.INVALID_INPUTS\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="spec.description" data-input-value="$ctrl.data.spec.description" data-form-object="newProjectForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_DESCRIPTION\' | i18next }}"></igz-validating-input-field></div></div></form></div><div class="buttons"><button class="ncl-secondary-button" data-test-id="projects.new-project_cancel.button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">{{ \'common:CANCEL\' | i18next }}</button><button class="ncl-primary-button" data-test-id="projects.new-project_create.button" tabindex="0" data-ng-click="$ctrl.createProject()" data-ng-keydown="$ctrl.createProject($event)" data-ng-hide="$ctrl.isLoadingState">{{ \'common:CREATE\' | i18next }}</button><button class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">{{ \'common:LOADING_CAPITALIZE_ELLIPSIS\' | i18next }}</button></div><div class="error-text text-centered error-relative" data-ng-show="$ctrl.isServerError()">{{ \'common:ERROR\' | i18next }}:&nbsp;{{$ctrl.serverError}}</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/ncl-project.tpl.html',
    '<section class="igz-general-content" data-igz-extend-background data-ui-view="project"></section>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/projects-table-row/projects-table-row.tpl.html',
    '<div class="ncl-projects-table-row common-table-row"><div class="common-table-cell check-row"><igz-action-checkbox data-item="$ctrl.project"></igz-action-checkbox></div><div class="igz-row common-table-cells-container inactive-state" data-ng-click="$ctrl.showDetails($event)"><div class="igz-col-25 common-table-cell name">{{$ctrl.project.spec.displayName || $ctrl.project.metadata.name}}</div><div class="igz-col-{{$ctrl.isDemoMode() ? \'25\' : \'75\'}} common-table-cell description">{{$ctrl.project.spec.description}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell created-by">{{$ctrl.project.spec.created_by}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell created-date">{{$ctrl.project.spec.created_date | date: \'MMM dd, yyyy\'}}</div></div><div class="common-table-cell actions-menu"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/projects-welcome-page/projects-welcome-page.tpl.html',
    '<div class="projects-welcome-page"><div class="create-new-project"><div class="header">{{ \'functions:GET_STARTED_WITH_YOUR_PROJECT\' | i18next }}</div><div class="description">{{ \'functions:WELCOME_DESCRIPTION\' | i18next }}</div><div class="welcome-icon"><div class="ellipse"><div class="shape"></div><div class="shape-shadow"></div></div></div><div class="ncl-new-entity-button" data-ng-click="$ctrl.openNewProjectDialog()">{{ \'functions:CREATE_PROJECT\' | i18next }}</div><div class="ncl-new-entity-button" ngf-select="$ctrl.importProject($file)" accept=".yml, .yaml">{{ \'functions:IMPORT_PROJECTS\' | i18next }}</div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-item/action-item-more/action-item-more.tpl.html',
    '<div class="igz-action-item" data-ng-class="{\'subtemplate-show\': $ctrl.isDropdownShown}"><div data-uib-tooltip="{{ \'common:MORE_OPTIONS\' | i18next }}" data-tooltip-popup-delay="1000" data-tooltip-placement="bottom"><div class="action-icon igz-icon-context-menu" data-ng-click="$ctrl.toggleTemplate()"></div></div><div class="item-dropdown-menu igz-component" data-ng-show="$ctrl.isDropdownShown"><ul class="item-dropdown-menu-list"><igz-action-item data-ng-repeat="action in $ctrl.actions" data-action="action" data-on-files-dropped="$ctrl.onFilesDropped" data-template="additional" data-ng-click="action.template ? \'\' : $ctrl.toggleTemplate()"></igz-action-item></ul><div class="transclude-container" data-ng-transclude></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/action-item/action-item-refresh/action-item-refresh.tpl.html',
    '<div class="igz-action-item" data-ng-class="{\'inactive\': $ctrl.isDisabled}" data-uib-tooltip="{{ \'common:REFRESH\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.refresh()"><div class="action-icon igz-icon-refresh"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/info-page/info-page-actions-bar/info-page-actions-bar.tpl.html',
    '<div class="igz-info-page-actions-bar" data-ng-class="{\'filters-opened\' : $ctrl.isFiltersShowed, \'info-pane-opened\' : $ctrl.isInfoPaneShowed, \'upper-pane-opened\' : $ctrl.isUpperPaneShowed}"><div data-ng-transclude></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/info-page/info-page-content/info-page-content.tpl.html',
    '<div class="igz-info-page-content-wrapper" data-ng-class="{\'info-pane-opened\' : $ctrl.isInfoPaneShowed, \'filters-opened\' : $ctrl.isFiltersShowed, \'upper-pane-opened\' : $ctrl.isUpperPaneShowed}"><div data-ng-if="$ctrl.scrolled !== false" class="igz-scrollable-container horizontal" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfigHorizontal"><div class="igz-info-page-content"><div data-ng-transclude></div></div></div><div data-ng-if="$ctrl.scrolled === false"><div class="igz-info-page-content"><div data-ng-transclude></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('igz_controls/components/info-page/info-page-filters/info-page-filters.tpl.html',
    '<div class="info-page-filters-wrapper"><div class="info-page-filters" data-ng-show="$ctrl.isFiltersShowed" data-ng-keyup="$ctrl.onApplyFilters($event)"><div class="info-page-filters-title">{{ \'common:FILTER\' | i18next }}</div><div class="close-button igz-icon-close" data-ng-click="$ctrl.changeStateCallback({newVal: false})" data-ng-show="$ctrl.changeStateCallback"></div><div class="info-page-filters-body" data-ng-class="{\'buttons-shown\' : $ctrl.isShowFooterButtons()}" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollbarConfig"><div data-ng-transclude></div></div><div class="info-page-filters-footer" data-ng-if="$ctrl.isShowFooterButtons()"><button class="igz-button-just-text" tabindex="0" data-ng-click="$ctrl.onResetFilters()" data-ng-keydown="$ctrl.onResetFilters($event)" data-ng-if="$ctrl.resetFilters">{{ \'common:RESET\' | i18next }}</button><button class="igz-button-primary" tabindex="0" data-ng-click="$ctrl.onApplyFilters()" data-ng-keydown="$ctrl.onApplyFilters($event)" data-ng-if="$ctrl.applyFilters">{{ \'common:APPLY\' | i18next }}</button></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/breadcrumbs/breadcrumbs.tpl.html',
    '<span class="main-header-title"><span class="main-header-title-text" data-ng-click="$ctrl.goToProjectsList()" data-ng-class="{\'disable-behavior\': !$ctrl.mainHeaderTitle.project && $ctrl.mainHeaderTitle.function !== \'Create function\'}">{{ $ctrl.mainHeaderTitle.title | i18next }}</span><span class="igz-icon-right ncl-header-subtitle"></span></span><span class="main-header-title" data-ng-if="$ctrl.mainHeaderTitle.project"><span class="main-header-title-text" data-ng-click="$ctrl.goToFunctionsList()">{{$ctrl.mainHeaderTitle.project.spec.displayName || $ctrl.mainHeaderTitle.project.metadata.name}}</span><ncl-breadcrumbs-dropdown data-state="$ctrl.mainHeaderTitle.state" data-title="$ctrl.mainHeaderTitle.project.spec.displayName || $ctrl.mainHeaderTitle.project.metadata.name" data-project="$ctrl.mainHeaderTitle.project" data-type="projects" data-get-functions="$ctrl.getFunctions({id: id})" data-get-projects="$ctrl.getProjects()"></ncl-breadcrumbs-dropdown></span><span class="main-header-title" data-ng-if="$ctrl.mainHeaderTitle.function && $ctrl.mainHeaderTitle.version"><span class="main-header-title-text" data-ng-click="$ctrl.goToFunctionScreen()">{{$ctrl.mainHeaderTitle.function}}</span><ncl-breadcrumbs-dropdown data-ng-if="$ctrl.mainHeaderTitle.version" data-state="$ctrl.mainHeaderTitle.state" data-title="$ctrl.mainHeaderTitle.function" data-project="$ctrl.mainHeaderTitle.project" data-type="functions" data-get-functions="$ctrl.getFunctions({id: id})" data-get-projects="$ctrl.getProjects()"></ncl-breadcrumbs-dropdown></span><span data-ng-if="$ctrl.mainHeaderTitle.function === \'Create function\'" class="ncl-bold-subtitle">{{$ctrl.mainHeaderTitle.function}}</span><span data-ng-if="$ctrl.mainHeaderTitle.version" class="ncl-bold-subtitle">{{$ctrl.mainHeaderTitle.version}}</span>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
    '<div class="ncl-breadcrumbs-dropdown dropdown" data-ng-class="{\'open\': $ctrl.showDropdownList}"><span class="breadcrumb-toggle" data-ng-click="$ctrl.showDropdown()"><span class="breadcrumb-arrow" data-ng-class="{\'ncl-dropdown-expanded\': $ctrl.showDropdownList}"><span class="igz-icon-right"></span></span></span><div class="dropdown-menu"><div class="search-input"><input type="text" placeholder="{{$ctrl.placeholder}}" data-ng-model="$ctrl.searchText"><span class="igz-icon-search"></span></div><ul class="dropdown-list" data-ng-scrollbars><li data-ng-repeat="item in $ctrl.itemsList | filter: $ctrl.searchText"><a class="item-name" data-ng-click="$ctrl.showDetails($event, item)">{{item.name}}</a><span class="igz-icon-tick" data-ng-show="$ctrl.title === item.name"></span></li></ul></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/collapsing-row/collapsing-row.tpl.html',
    '<div class="ncl-collapsing-row"><div class="title-block common-table-row" data-ng-class="{\'collapsed\': !$ctrl.item.ui.editModeActive}"><div class="common-table-cell row-collapse"><span class="collapse-icon" data-ng-click="$ctrl.onCollapse($event)" data-ng-class="{\'collapsed igz-icon-right\': !$ctrl.item.ui.editModeActive,\n' +
    '                                  \'igz-icon-down\': $ctrl.item.ui.editModeActive}"></span></div><div data-ng-show="!$ctrl.item.ui.editModeActive" class="igz-row common-table-cells-container item-row"><div class="text-ellipsis item-name" data-ng-if="!$ctrl.isNil($ctrl.item.name)">{{$ctrl.item.name}}</div><div class="text-ellipsis item-name" data-ng-if="!$ctrl.isNil($ctrl.item.volumeMount.name)">{{ $ctrl.item.volumeMount.name }}</div><div class="item-class" data-ng-if="!$ctrl.isNil($ctrl.item.ui.className)">{{$ctrl.item.ui.className}}</div><div class="item-class" data-ng-if="!$ctrl.isNil($ctrl.item.volume.hostPath)">{{ \'functions:HOST_PATH\' | i18next }}</div><div class="item-class" data-ng-if="!$ctrl.isNil($ctrl.item.volume.flexVolume)">{{ \'functions:V3IO\' | i18next }}</div><div class="item-class" data-ng-if="!$ctrl.isNil($ctrl.item.volume.secret.secretName)">{{ \'functions:SECRET\' | i18next }}</div><div class="item-class" data-ng-if="!$ctrl.isNil($ctrl.item.volume.configMap.name)">{{ \'functions:CONFIG_MAP\' | i18next }}</div><div class="item-class" data-ng-if="!$ctrl.isNil($ctrl.item.volume.persistentVolumeClaim.claimName)">{{ \'functions:PVC\' | i18next }}</div><div class="igz-col-70 item-info"><div data-ng-hide="$ctrl.item.ui.editModeActive" class="collapsed-item-info-block"><span data-ng-if="!$ctrl.isNil($ctrl.item.url)"><span class="field-label">{{ \'common:URL\' | i18next }}</span>:&nbsp;{{ $ctrl.item.url }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.maxWorkers)"><span class="field-label">{{ \'functions:MAX_WORKERS\' | i18next }}</span>:&nbsp;{{ $ctrl.item.maxWorkers }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.workerAvailabilityTimeoutMilliseconds)"><span class="field-label">{{ \'functions:WORKER_AVAILABILITY_TIMEOUT\' | i18next }}</span>:&nbsp;{{ $ctrl.item.workerAvailabilityTimeoutMilliseconds }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.secret)"><span class="field-label">{{ \'functions:SECRET\' | i18next }}</span>:&nbsp;{{ $ctrl.item.secret }};&nbsp;</span><span data-ng-repeat="(key, value) in $ctrl.item.attributes"><span class="field-label">{{ key }}</span>:&nbsp;{{ $ctrl.getAttributeValue(key, value) }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.annotations)"><span class="field-label">{{ \'functions:ANNOTATIONS\' | i18next }}</span>: {{ $ctrl.item.annotations }};</span><span data-ng-if="!$ctrl.isNil($ctrl.item.username)"><span class="field-label">{{ \'common:USERNAME\' | i18next }}</span>: {{ $ctrl.item.username }};</span><span data-ng-if="!$ctrl.isNil($ctrl.item.password)"><span class="field-label">{{ \'common:PASSWORD\' | i18next }}</span>: {{ $ctrl.item.password }};</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volumeMount.mountPath)"><span class="field-label">{{ \'functions:MOUNT_PATH\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volumeMount.mountPath }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.hostPath)"><span class="field-label">{{ \'functions:HOST_PATH\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volume.hostPath.path }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.flexVolume.options.accessKey)"><span class="field-label">{{ \'functions:ACCESS_KEY\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volume.flexVolume.options.accessKey }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.flexVolume.options.container)"><span class="field-label">{{ \'functions:CONTAINER_NAME\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volume.flexVolume.options.container }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.flexVolume.options.subPath)"><span class="field-label">{{ \'functions:SUB_PATH\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volume.flexVolume.options.subPath }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.secret.secretName)"><span class="field-label">{{ \'functions:SECRET_NAME\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volume.secret.secretName }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.configMap.name)"><span class="field-label">{{ \'functions:CONFIG_MAP_NAME\' | i18next }}</span>:&nbsp;{{ $ctrl.item.volume.configMap.name }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.volume.persistentVolumeClaim.claimName)"><span class="field-label">{{ \'functions:PERSISTENT_VOLUME_CLAIM_NAME\' | i18next }}</span>: &nbsp;{{ $ctrl.item.volume.persistentVolumeClaim.claimName }};&nbsp;</span><span data-ng-if="!$ctrl.isNil($ctrl.item.workerAllocatorName)"><span class="field-label">{{ \'functions:WORKER_ALLOCATOR_NAME\' | i18next }}</span>:&nbsp;{{ $ctrl.item.workerAllocatorName }};&nbsp;</span></div><div data-ng-hide="!$ctrl.item.ui.expanded" class="expanded-item-info-block"><div class="igz-row common-table-cells-container item-info-row" data-ng-if="!$ctrl.isNil($ctrl.item.url)"><div class="igz-col-30 common-table-cell field-label">{{ \'common:URL\' | i18next }}:</div><div class="igz-col-70 common-table-cell">{{ $ctrl.item.url }}</div></div><div class="igz-row common-table-cells-container item-info-row" data-ng-if="!$ctrl.isNil($ctrl.item.maxWorkers)"><div class="igz-col-30 common-table-cell field-label">{{ \'functions:MAX_WORKERS\' | i18next }}:</div><div class="igz-col-70 common-table-cell">{{ $ctrl.item.maxWorkers }}</div></div><div class="igz-row common-table-cells-container item-info-row" data-ng-if="!$ctrl.isNil($ctrl.item.secret)"><div class="igz-col-30 common-table-cell field-label">{{ \'functions:SECRET\' | i18next }}:</div><div class="igz-col-70 common-table-cell">{{ $ctrl.item.secret }}</div></div><div class="igz-row common-table-cells-container item-info-row" data-ng-repeat="(key, value) in $ctrl.item.attributes"><div class="igz-col-30 common-table-cell field-label">{{ key }}:</div><div class="igz-col-70 common-table-cell">{{ value }}</div></div></div></div></div><div data-ng-transclude class="igz-col-100" data-ng-if="$ctrl.item.ui.editModeActive"></div><div class="common-table-cell actions-menu" data-ng-if="::$ctrl.showDotMenu()"><igz-action-menu data-actions="$ctrl.actions" data-list-class="$ctrl.listClass" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div><div class="common-table-cell single-action" data-ng-if="::!$ctrl.showDotMenu()"><div class="igz-action-panel"><div class="actions-list"><div class="igz-action-item" data-ng-click="$ctrl.onClickAction($ctrl.actions[0])"><span class="action-icon" data-ng-class="$ctrl.actions[0].icon"></span></div></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/deploy-log/deploy-log.tpl.html',
    '<div class="ncl-deploy-log-wrapper"><div class="log-panel igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="log-entry" data-ng-repeat="log in $ctrl.logEntires track by $index"><span class="log-entry-time" data-ng-if="log.time">[{{log.time | date:\'HH:mm:ss.sss\'}}]</span><span class="log-entry-level-{{log.level}}" data-ng-if="log.level">&nbsp;({{$ctrl.getLogLevel(log.level)}})</span><span class="log-entry-message">&nbsp;{{log.message}}</span><span class="log-entry-error" data-ng-if="log.err">&nbsp;{{log.err}}</span><span class="log-entry-params">&nbsp;{{$ctrl.getLogParams(log)}}</span></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/edit-item/edit-item.tpl.html',
    '<div class="ncl-edit-item" data-ng-keydown="$ctrl.onSubmitForm($event)"><form name="$ctrl.editItemForm" novalidate autocomplete="off"><div class="igz-row title-field-row"><div class="igz-col-20 name-field"><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemName" data-input-value="$ctrl.getInputValue()" data-is-focused="true" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="name" autocomplete="off"></igz-validating-input-field><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState($ctrl.editItemForm, \'itemName\')">{{ \'common:ERROR_MSG.INVALID_INPUTS\' | i18next }}</div></div><div class="igz-col-12-5 class-field"><igz-default-dropdown data-select-property-only="id" data-input-name="itemClass" data-is-required="true" data-placeholder="{{ $ctrl.placeholder }}" data-prevent-drop-up="true" data-values-array="$ctrl.classList" data-selected-item="$ctrl.selectedClass.id" data-form-object="$ctrl.editItemForm" data-item-select-callback="$ctrl.onSelectClass(item)" data-enable-overlap="true"></igz-default-dropdown></div><div class="igz-col-65 tooltip-wrapper"><igz-more-info data-ng-if="$ctrl.isTooltipVisible()" data-description="{{$ctrl.getTooltip()}}" data-trigger="click" data-is-html-enabled="true"></igz-more-info></div></div><div class="igz-row"><div class="igz-col-100 no-class-selected" data-ng-if="!$ctrl.isClassSelected()">{{ $ctrl.placeholder }}</div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.url)"><div class="field-label">{{ \'common:URL\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemURL" data-input-value="$ctrl.item.url" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'common:PLACEHOLDER.ENTER_URL\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="url" data-auto-complete="off"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volumeMount.mountPath)"><div class="field-label"><span>{{ \'functions:MOUNT_PATH\' | i18next }}</span><igz-more-info data-description="{{ \'functions:MOUNT_PATH_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemPath" data-input-value="$ctrl.item.volumeMount.mountPath" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_MOUNT_PATH\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volumeMount.mountPath" data-auto-complete="off"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.flexVolume.options.accessKey)"><div class="field-label"><span>{{ \'functions:ACCESS_KEY\' | i18next }}</span><igz-more-info data-description="{{ \'functions:ACCESS_KEY_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field class="nuclio-validating-input" data-field-type="password" data-auto-complete="current-password" data-input-name="secretRef" data-input-value="$ctrl.item.volume.flexVolume.options.accessKey" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_ACCESS_KEY\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.flexVolume.options.accessKey" data-auto-complete="off"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.flexVolume.options.container)"><div class="field-label"><span>{{ \'functions:CONTAINER_NAME\' | i18next }}</span><igz-more-info data-description="{{ \'functions:CONTAINER_NAME_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="containerName" data-input-value="$ctrl.item.volume.flexVolume.options.container" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_CONTAINER_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.flexVolume.options.container" data-auto-complete="off"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.flexVolume.options.subPath)"><div class="field-label"><span>{{ \'common:PATH\' | i18next }}</span><igz-more-info data-description="{{ \'functions:PATH_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="containerSubPath" data-input-value="$ctrl.item.volume.flexVolume.options.subPath" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="false" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_PATH_IN_CONTAINER\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.flexVolume.options.subPath" data-auto-complete="off"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.hostPath.path)"><div class="field-label">{{ \'functions:HOST_PATH\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="hostPath" data-input-value="$ctrl.item.volume.hostPath.path" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_HOST_PATH\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.hostPath.path"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.secret.secretName)"><div class="field-label">{{ \'functions:SECRET_NAME\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="secretName" data-input-value="$ctrl.item.volume.secret.secretName" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_SECRET_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.secret.secretName"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.configMap.name)"><div class="field-label">{{ \'functions:CONFIG_MAP_NAME\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="configMap" data-input-value="$ctrl.item.volume.configMap.name" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_CONFIG_MAP_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.configMap.name"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.volume.persistentVolumeClaim.claimName)"><div class="field-label text-ellipsis">{{ \'functions:PERSISTENT_VOLUME_CLAIM_NAME\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="persistentVolumeClaim" data-input-value="$ctrl.item.volume.persistentVolumeClaim.claimName" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_PERSISTENT_VOLUME_CLAIM_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="volume.persistentVolumeClaim.claimName"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.maxWorkers)"><div class="field-label">{{ \'functions:MAX_WORKERS\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemMaxWorkers" data-input-value="$ctrl.item.maxWorkers" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.numberValidationPattern" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_MAX_WORKERS\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="maxWorkers"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.workerAvailabilityTimeoutMilliseconds)"><div class="field-label">{{ \'functions:WORKER_AVAILABILITY_TIMEOUT_MILLISECONDS\' | i18next }}</div><igz-number-input data-form-object="$ctrl.editItemForm" data-input-name="{{$ctrl.selectedClass.workerAvailabilityTimeoutMilliseconds.name}}" data-current-value="$ctrl.item.workerAvailabilityTimeoutMilliseconds" data-update-number-input-callback="$ctrl.numberInputCallback(newData, field)" data-update-number-input-field="workerAvailabilityTimeoutMilliseconds" data-placeholder="" data-decimal-number="0" data-value-step="1" data-validation-is-required="!$ctrl.selectedClass.workerAvailabilityTimeoutMilliseconds.allowEmpty" data-allow-empty-field="$ctrl.selectedClass.workerAvailabilityTimeoutMilliseconds.allowEmpty" data-min-value="0"></igz-number-input></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && attribute.type === \'input\' && attribute.name !== \'schedule\'" data-ng-repeat="attribute in $ctrl.selectedClass.attributes"><div class="field-label">{{$ctrl.convertFromCamelCase(attribute.name)}}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="{{attribute.fieldType}}" data-input-name="item_{{attribute.name}}" data-input-value="$ctrl.getAttrValue(attribute.name)" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.getValidationPattern(attribute.pattern)" data-validation-is-required="!attribute.allowEmpty" data-placeholder-text="{{$ctrl.getPlaceholderText(attribute)}}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="attributes.{{attribute.name}}"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && attribute.type === \'dropdown\'" data-ng-repeat="attribute in $ctrl.selectedClass.attributes"><div class="field-label">{{$ctrl.convertFromCamelCase(attribute.name)}}</div><igz-default-dropdown data-select-property-only="id" data-placeholder="{{$ctrl.convertFromCamelCase(attribute.name) | lowercase}}..." data-values-array="attribute.values" data-form-object="$ctrl.editItemForm" data-is-required="true" data-prevent-drop-up="true" data-input-name="{{attribute.name}}" data-selected-item="$ctrl.getAttrValue(attribute.name)" data-item-select-callback="$ctrl.onSelectDropdownValue(item, field)" data-item-select-field="attributes.{{attribute.name}}" data-enable-overlap="true"></igz-default-dropdown></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && attribute.type === \'number-input\'" data-ng-repeat="attribute in $ctrl.selectedClass.attributes"><div class="field-label">{{$ctrl.convertFromCamelCase(attribute.name)}}</div><igz-number-input data-form-object="$ctrl.editItemForm" data-input-name="{{attribute.name}}" data-current-value="$ctrl.getAttrValue(attribute.name)" data-update-number-input-callback="$ctrl.numberInputCallback(newData, field)" data-update-number-input-field="attributes.{{attribute.name}}" data-placeholder="" data-decimal-number="0" data-value-step="1" data-suffix-unit="{{attribute.unit}}" data-validation-is-required="!attribute.allowEmpty" data-allow-empty-field="attribute.allowEmpty" data-min-value="0" data-max-value="attribute.maxValue"></igz-number-input></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.username)"><div class="field-label">{{ \'common:USERNAME\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="username" data-input-value="$ctrl.item.username" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.stringValidationPattern" data-validation-is-required="false" data-placeholder-text="{{ \'common:PLACEHOLDER.ENTER_USERNAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="username"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.password)"><div class="field-label">{{ \'common:PASSWORD\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="password" data-input-value="$ctrl.item.password" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.stringValidationPattern" data-validation-is-required="false" data-placeholder-text="{{ \'common:PLACEHOLDER.ENTER_PASSWORD\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="password"></igz-validating-input-field></div><div class="igz-col-45 attribute-field attribute-field-checkbox" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.attributes.sasl.enable)"><div class="checkbox-block"><input type="checkbox" class="small" id="saslEnable" data-ng-model="$ctrl.item.attributes.sasl.enable"><label for="saslEnable" class="checkbox-inline field-label">{{ \'functions:SASL_ENABLE\' | i18next }}</label></div></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.attributes.sasl.user)"><div class="field-label">{{ \'functions:SASL_USERNAME\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemSASLUsername" data-input-value="$ctrl.item.attributes.sasl.user" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.stringValidationPattern" data-validation-is-required="false" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_SASL_USERNAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="attributes.sasl.user"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.attributes.sasl.password)"><div class="field-label">{{ \'functions:SASL_PASSWORD\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemSASLPassword" data-input-value="$ctrl.item.attributes.sasl.password" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.stringValidationPattern" data-validation-is-required="false" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_SASL_PASSWORD\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="attributes.sasl.password"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.attributes.event.body)"><div class="field-label">{{ \'functions:EVENT_BODY\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="eventBody" data-input-value="$ctrl.item.attributes.event.body" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.stringValidationPattern" data-validation-is-required="false" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_EVENT_BODY\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="attributes.event.body"></igz-validating-input-field></div><div class="igz-col-91 attribute-field ingresses-wrapper" data-ng-if="$ctrl.isClassSelected() && $ctrl.isHttpTrigger()"><div class="field-label">{{ \'functions:INGRESSES\' | i18next }}</div><div data-ng-if="$ctrl.ingresses.length > 0" class="table-headers ingresses-table-headers"><div class="host-header">{{ \'functions:HOST\' | i18next }}</div><div class="paths-header">{{ \'common:PATH\' | i18next }}</div><div class="secret-header">{{ \'functions:SECRET\' | i18next }}</div></div><div class="igz-scrollable-container scrollable-ingresses" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="ingress in $ctrl.ingresses"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-ingresses" data-change-state-broadcast="change-state-deploy-button" data-key-optional="true" data-row-data="ingress" data-use-type="false" data-use-additional-value="true" data-additional-value-optional="true" data-submit-on-fly="true" data-item-index="$index" data-action-handler-callback="$ctrl.handleIngressAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-ingress-button" data-ng-click="$ctrl.addNewIngress($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_INGRESS\' | i18next }}</div></div><div class="igz-col-91 attribute-field annotations-wrapper" data-ng-if="$ctrl.isClassSelected() && $ctrl.isHttpTrigger()"><div class="field-label">{{ \'functions:ANNOTATIONS\' | i18next }}</div><div data-ng-if="$ctrl.annotations.length > 0" class="table-headers"><div class="key-header">{{ \'common:KEY\' | i18next }}</div><div class="value-header">{{ \'common:VALUE\' | i18next }}</div></div><div class="igz-scrollable-container scrollable-annotations" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="annotation in $ctrl.annotations"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-annotations" data-change-state-broadcast="change-state-deploy-button" data-key-optional="true" data-row-data="annotation" data-use-type="false" data-submit-on-fly="true" data-item-index="$index" data-action-handler-callback="$ctrl.handleAnnotationAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-annotation-button" data-ng-click="$ctrl.addNewAnnotation($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_ANNOTATION\' | i18next }}</div></div><div class="igz-col-91 attribute-field" data-ng-if="$ctrl.isClassSelected() && $ctrl.isCronTrigger()"><div class="field-label">{{ \'common:SCHEDULE\' | i18next }}</div><div class="schedule-input-wrapper"><igz-validating-input-field data-field-type="schedule" data-input-name="item_schedule" data-input-value="$ctrl.item.attributes.schedule" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="attributes.schedule"></igz-validating-input-field><div class="clear-button" data-ng-if="$ctrl.item.attributes.schedule"><a class="link" data-ng-click="$ctrl.onClearButtonClick()">{{ \'common:CLEAR\' | i18next }}</a></div></div></div><div class="igz-col-91 attribute-field event-headers-wrapper" data-ng-if="$ctrl.isClassSelected() && $ctrl.isCronTrigger()"><div class="field-label">{{ \'functions:EVENT_HEADERS\' | i18next }}</div><div data-ng-if="$ctrl.eventHeaders.length > 0" class="table-headers"><div class="key-header">{{ \'common:KEY\' | i18next }}</div><div class="value-header">{{ \'common:VALUE\' | i18next }}</div></div><div class="igz-scrollable-container scrollable-event-headers" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="header in $ctrl.eventHeaders"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-event-headers" data-change-state-broadcast="change-state-deploy-button" data-key-optional="true" data-row-data="header" data-use-type="false" data-submit-on-fly="true" data-item-index="$index" data-action-handler-callback="$ctrl.handleEventHeaderAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-event-header" data-ng-click="$ctrl.addNewEventHeader($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_EVENT_HEADER\' | i18next }}</div></div><div class="igz-col-91 attribute-field subscriptions-wrapper" data-ng-if="$ctrl.isClassSelected() && $ctrl.isMQTTTrigger()"><div class="field-label">{{ \'functions:SUBSCRIPTIONS\' | i18next }}</div><div data-ng-if="$ctrl.subscriptions.length > 0" class="table-headers"><div class="key-header">{{ \'functions:TOPIC\' | i18next }}</div><div class="value-header">{{ \'functions:QOS\' | i18next }}</div></div><div><div class="table-body" data-ng-repeat="subscription in $ctrl.subscriptions"><ncl-key-value-input class="new-label-input" data-list-class="subscriptions-wrapper" data-change-state-broadcast="change-state-deploy-button" data-key-optional="false" data-row-data="subscription" data-use-type="false" data-submit-on-fly="true" data-item-index="$index" data-value-validation-pattern="$ctrl.subscriptionQoSValidationPattern" data-value-placeholder="0, 1 or 2" data-action-handler-callback="$ctrl.handleSubscriptionAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-subscription-button" data-ng-click="$ctrl.addNewSubscription($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_SUBSCRIPTION\' | i18next }}</div></div><div class="igz-col-45 attribute-field topics-wrapper" data-ng-if="$ctrl.isClassSelected() && $ctrl.isKafkaTrigger()"><div class="field-label">{{ \'functions:TOPICS\' | i18next }}</div><div><div class="table-body" data-ng-repeat="topic in $ctrl.topics"><ncl-key-value-input class="new-label-input" data-list-class="topics-wrapper" data-change-state-broadcast="change-state-deploy-button" data-row-data="topic" data-use-type="false" data-submit-on-fly="true" data-item-index="$index" data-only-value-input="true" data-value-validation-pattern="$ctrl.stringValidationPattern" data-action-handler-callback="$ctrl.handleTopicAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-topic-button" data-ng-click="$ctrl.addNewTopic($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_TOPIC\' | i18next }}</div></div><div class="igz-col-45 attribute-field brokers-wrapper" data-ng-if="$ctrl.isClassSelected() && $ctrl.isKafkaTrigger()"><div class="field-label">{{ \'functions:BROKERS\' | i18next }}</div><div><div class="table-body" data-ng-repeat="broker in $ctrl.brokers"><ncl-key-value-input class="new-label-input" data-list-class="brokers-wrapper" data-change-state-broadcast="change-state-deploy-button" data-row-data="broker" data-use-type="false" data-submit-on-fly="true" data-item-index="$index" data-only-value-input="true" data-value-validation-pattern="$ctrl.stringValidationPattern" data-action-handler-callback="$ctrl.handleBrokerAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-broker-button" data-ng-click="$ctrl.addNewBroker($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_BROKER\' | i18next }}</div></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && $ctrl.isTriggerType()"><div class="field-label">{{ \'functions:WORKER_ALLOCATOR_NAME\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="itemWorkerAllocatorName" data-input-value="$ctrl.item.workerAllocatorName" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="false" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_WORKER_ALLOCATOR_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="workerAllocatorName"></igz-validating-input-field></div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/function-config-dialog/function-config-dialog.tpl.html',
    '<div class="view-yaml-dialog-container"><div class="view-yaml-dialog-header"><div class="title">{{ $ctrl.title }}</div><igz-copy-to-clipboard data-value="$ctrl.sourceCode"></igz-copy-to-clipboard><div class="close-button igz-icon-close" data-ng-click="$ctrl.closeDialog()"></div></div><div class="main-content"><ncl-monaco class="monaco-code-editor" data-function-source-code="$ctrl.sourceCode" data-mini-monaco="false" data-selected-theme="$ctrl.editorTheme" data-language="yaml" data-read-only="true"></ncl-monaco></div><div class="buttons"><button class="igz-button-primary" tabindex="0" data-ng-click="$ctrl.closeDialog()">{{ \'common:CLOSE\' | i18next }}</button></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/key-value-input/key-value-input.tpl.html',
    '<div class="ncl-key-value-input"><form name="$ctrl.keyValueInputForm" class="input-wrapper" data-ng-mousedown="$ctrl.onEditInput()"><div class="check-row" data-ng-if="$ctrl.allowSelection"><igz-action-checkbox data-item="$ctrl.data"></igz-action-checkbox></div><div class="inputs-container" data-ng-class="{\'use-type\': $ctrl.useType, \'use-checkbox\': $ctrl.allowSelection}"><div class="input-container input-key-wrapper" data-ng-if="!$ctrl.onlyValueInput" data-ng-class="{\'use-type\': $ctrl.useType, \'all-value-types\': $ctrl.allValueTypes}"><label for="key" data-ng-if="$ctrl.useLabels" class="key-label">{{ \'common:KEY\' | i18next }}:</label><igz-validating-input-field class="nuclio-validating-input input-key" data-field-type="input" data-input-name="key" data-input-value="$ctrl.data.name" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="name" data-form-object="$ctrl.keyValueInputForm" data-validation-is-required="!$ctrl.keyOptional" data-validation-pattern="$ctrl.keyValidationPattern" data-placeholder-text="{{$ctrl.keyPlaceholder}}"></igz-validating-input-field></div><div class="input-container input-type-wrapper" data-ng-if="$ctrl.useType" data-ng-class="{\'use-type\': $ctrl.useType, \'all-value-types\': $ctrl.allValueTypes}"><label for="type" data-ng-if="$ctrl.useLabels" class="type-label">{{ \'common:TYPE\' | i18next }}:</label><igz-default-dropdown class="input-type" data-form-object="$ctrl.keyValueInputForm" data-select-property-only="id" data-prevent-drop-up="true" data-input-name="type" data-values-array="$ctrl.typesList" data-selected-item="$ctrl.getType()" data-placeholder="{{ \'common:PLACEHOLDER.SELECT_TYPE\' | i18next }}" data-item-select-callback="$ctrl.onTypeChanged(item, isItemChanged)" data-enable-overlap="$ctrl.dropdownOverlap"></igz-default-dropdown></div><div class="input-container input-value-key-wrapper" data-ng-if="!$ctrl.isVisibleByType(\'value\')" data-ng-class="{\'use-type\': $ctrl.useType}"><label for="value-key" data-ng-if="$ctrl.useLabels"><span data-ng-if="$ctrl.isVisibleByType(\'secret\')">{{ \'functions:SECRET_KEY\' | i18next }}:</span><span data-ng-if="$ctrl.isVisibleByType(\'configmap\')">{{ \'functions:CONFIGMAP_KEY\' | i18next }}:</span></label><igz-validating-input-field class="nuclio-validating-input input-value-key" data-field-type="input" data-input-name="value-key" data-input-value="$ctrl.getInputKey()" data-update-data-callback="$ctrl.inputKeyCallback(newData)" data-update-data-field="value-key" data-form-object="$ctrl.keyValueInputForm" data-validation-is-required="!$ctrl.valueOptional" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_KEY\' | i18next }}"></igz-validating-input-field></div><div class="input-container input-value-wrapper" data-ng-class="{\'use-type\': $ctrl.useType,\n' +
    '                                 \'only-value-input\': $ctrl.onlyValueInput,\n' +
    '                                 \'only-key-value-input\': $ctrl.isVisibleByType(\'value\'),\n' +
    '                                 \'all-value-types\': $ctrl.allValueTypes}"><label for="value" data-ng-if="$ctrl.useLabels"><span data-ng-if="$ctrl.isVisibleByType(\'value\')">{{ \'common:VALUE\' | i18next }}:</span><span data-ng-if="$ctrl.isVisibleByType(\'secret\')">{{ \'functions:SECRET_NAME\' | i18next }}:</span><span data-ng-if="$ctrl.isVisibleByType(\'configmap\')">{{ \'functions:CONFIGMAP_NAME\' | i18next }}:</span></label><igz-validating-input-field class="nuclio-validating-input input-value" data-field-type="input" data-input-name="value" data-input-value="$ctrl.getInputValue()" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="value" data-form-object="$ctrl.keyValueInputForm" data-validation-is-required="!$ctrl.valueOptional" data-validation-pattern="$ctrl.valueValidationPattern" data-placeholder-text="{{$ctrl.valuePlaceholder}}"></igz-validating-input-field><igz-validating-input-field class="nuclio-validating-input input-additional-value" data-ng-if="$ctrl.useAdditionalValue && $ctrl.isVisibleByType(\'value\')" data-field-type="input" data-input-name="additionalValue" data-input-value="$ctrl.data.additionalValue" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="additionalValue" data-form-object="$ctrl.keyValueInputForm" data-validation-is-required="!$ctrl.additionalValueOptional"></igz-validating-input-field></div></div><div class="three-dot-menu" data-ng-if="::$ctrl.showDotMenu()"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction" data-list-class="$ctrl.listClass"></igz-action-menu></div><div class="igz-action-panel" data-ng-if="::!$ctrl.showDotMenu()"><div class="actions-list"><div class="igz-action-item" data-ng-click="$ctrl.onClickAction($ctrl.actions[0])"><span class="action-icon" data-ng-class="$ctrl.actions[0].icon"></span></div></div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/monaco/monaco.tpl.html',
    '<div class="ncl-monaco"><div class="ncl-monaco-wrapper" data-ng-class="{\'ncl-monaco-dark\': $ctrl.selectedTheme === \'vs-dark\',\n' +
    '                         \'no-top-padding\': $ctrl.noTopPadding}"><div data-ng-if="$ctrl.showTextSizeDropdown" class="ncl-monaco-top-row"><ncl-text-size-dropdown data-update-data-callback="$ctrl.onTextSizeChange(newTextSize)"></ncl-text-size-dropdown></div><div class="ncl-monaco-editor" igz-monaco-editor data-font-size="$ctrl.selectedTextSize" data-code-file="selectedCodeFile" data-editor-theme="$ctrl.selectedTheme" data-file-language="selectedFileLanguage" data-mini-monaco="$ctrl.miniMonaco" data-show-line-numbers="$ctrl.showLineNumbers" data-read-only="$ctrl.readOnly" data-on-code-change="$ctrl.onCodeChange" data-word-wrap="$ctrl.wordWrap"></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/navigation-tabs/navigation-tabs.tpl.html',
    '<div class="ncl-navigation-tabs-wrapper"><div class="ncl-navigation-tabs clearfix"><div class="navigation-tab" data-ng-repeat="item in $ctrl.tabItems" data-ui-sref="{{item.uiRoute}}" data-ui-sref-active="active" data-ng-class="{\'ncl-status-monitoring\': item.id === \'status\'}">{{item.tabName | uppercase}}<div class="ncl-status-light" data-ng-if="item.status" data-ng-class="{\'ncl-status-ready\': item.status === \'ready\',\n' +
    '                             \'ncl-status-error\': item.status === \'error\',\n' +
    '                             \'ncl-status-building\': $ctrl.isFunctionBuilding(item.status)}"><div class="ncl-status-tooltip" data-ng-if="item.status" data-ng-class="{\'ncl-status-tooltip-ready\': item.status === \'ready\',\n' +
    '                                 \'ncl-status-tooltip-error\': item.status === \'error\',\n' +
    '                                 \'ncl-status-tooltip-building\': $ctrl.isFunctionBuilding(item.status)}"><div class="ncl-status-icon" data-ng-if="item.status !== \'not yet deployed\'" data-ng-class="{\'ncl-icon-ready\': item.status === \'ready\',\n' +
    '                                     \'ncl-icon-error\': item.status === \'error\',\n' +
    '                                     \'ncl-icon-building\': $ctrl.isFunctionBuilding(item.status)}"></div><div class="ncl-status-title">{{item.status}}</div></div></div></div></div><div class="test-pane-actions-wrapper"><div class="igz-action-panel"><div class="actions-list"><div class="igz-action-item" data-ng-if="$ctrl.isToggleButtonVisible()" data-ng-class="{\'active\': !$ctrl.isTestPaneClosed}" data-ng-click="$ctrl.toggleTestPane()"><div class="action-icon igz-icon-test-pane"></div></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/nuclio-search-input/search-input.tpl.html',
    '<div class="ncl-search-input"><input type="text" class="container-search-input" placeholder="{{$ctrl.placeholder}}" data-ng-keydown="$ctrl.onPressEnter($event)" data-igz-input-blur-on-enter data-ng-model="$ctrl.searchQuery" data-ng-model-options="{ debounce: { \'default\': 500, \'blur\': 0 } }"><span class="igz-icon-search"></span></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/screens/create-function/create-function.tpl.html',
    '<igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="new-function-wrapper"><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.horizontalScrollConfig"><div class="new-function-header"><div class="title-wrapper"><div class="title">{{ \'functions:START_NEW_FUNCTION\' | i18next }}</div><div class="igz-icon-close" data-ng-click="$ctrl.cancelCreating($event)"></div></div><div class="new-function-types"><div class="type-wrapper"><div class="type-template function-from-template" data-ng-click="$ctrl.selectFunctionType(\'from_template\')" data-ng-class="{\'selected\': $ctrl.isTypeSelected(\'from_template\')}"><div class="function-type-icon"><span class="ncl-icon-template icon"></span></div><div class="function-type-info"><div class="type-title">{{ \'functions:TEMPLATES\' | i18next }}</div><div class="type-description">{{ \'functions:CREATE_FUNCTION_DESCRIPTION\' | i18next }}</div></div></div></div><div class="type-wrapper"><div class="type-template" data-ng-click="$ctrl.selectFunctionType(\'from_scratch\')" data-ng-class="{\'selected\': $ctrl.isTypeSelected(\'from_scratch\')}"><div class="function-type-icon"><span class="ncl-icon-add icon"></span></div><div class="function-type-info"><div class="type-title">{{ \'functions:START_FROM_SCRATCH\' | i18next }}</div><div class="type-description">{{ \'functions:START_FROM_SCRATCH_DESCRIPTION\' | i18next }}</div></div></div></div><div class="type-wrapper"><div class="type-template" data-ng-click="$ctrl.selectFunctionType(\'import\')" data-ng-class="{\'selected\': $ctrl.isTypeSelected(\'import\')}"><div class="function-type-icon"><span class="ncl-icon-import icon"></span></div><div class="function-type-info function-import"><div class="type-title">{{ \'functions:IMPORT\' | i18next }}</div><div class="type-description">{{ \'functions:IMPORT_FUNCTION_DESCRIPTION\' | i18next }}</div></div></div></div></div></div></div></div><div class="function-type-content-wrapper"><div class="new-function-type-content"><ncl-function-from-scratch data-ng-if="$ctrl.isTypeSelected(\'from_scratch\')" data-toggle-splash-screen="$ctrl.toggleSplashScreen(value)" data-project="$ctrl.project" data-create-new-project="$ctrl.createNewProject" data-selected-project="$ctrl.selectedProject" data-projects="$ctrl.projects"></ncl-function-from-scratch><ncl-function-from-template data-ng-if="$ctrl.isTypeSelected(\'from_template\')" data-get-function-templates="$ctrl.getTemplates()" data-templates="$ctrl.templates" data-toggle-splash-screen="$ctrl.toggleSplashScreen(value)" data-project="$ctrl.project" data-create-new-project="$ctrl.createNewProject" data-render-template="$ctrl.renderTemplate({template: template})" data-selected-project="$ctrl.selectedProject" data-projects="$ctrl.projects"></ncl-function-from-template><ncl-function-import data-ng-if="$ctrl.isTypeSelected(\'import\')" data-toggle-splash-screen="$ctrl.toggleSplashScreen(value)" data-project="$ctrl.project" data-selected-project="$ctrl.selectedProject" data-create-new-project="$ctrl.createNewProject" data-projects="$ctrl.projects"></ncl-function-import></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/functions.tpl.html',
    '<section data-igz-extend-background><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><igz-info-page-filters data-is-filters-showed="$ctrl.isFiltersShowed.value" data-apply-filters="$ctrl.onApplyFilters()" data-reset-filters="$ctrl.onResetFilters()" data-change-state-callback="$ctrl.isFiltersShowed.changeValue(newVal)" data-toggle-method="$ctrl.toggleFilters()"><igz-search-input class="info-page-filters-item igz-component" data-data-set="$ctrl.functions" data-search-keys="$ctrl.searchKeys" data-search-callback="$ctrl.onUpdateFiltersCounter(searchQuery)" data-placeholder="{{ \'functions:PLACEHOLDER.SEARCH_FUNCTIONS\' | i18next }}" data-live-search="false" data-search-states="$ctrl.searchStates"></igz-search-input></igz-info-page-filters><igz-info-page-actions-bar class="igz-component"><div class="actions-bar-left"><igz-action-panel data-actions="$ctrl.actions"></igz-action-panel></div><div class="actions-bar-right"><div class="actions-bar-left actions-buttons-block"><button class="ncl-new-entity-button" data-ng-click="$ctrl.openNewFunctionScreen()">{{ \'functions:CREATE_FUNCTION\' | i18next }}</button></div><div class="actions-bar-left actions-content-block"><div class="igz-action-panel"><div class="actions-list"><igz-action-item-refresh data-refresh="$ctrl.refreshFunctions()"></igz-action-item-refresh><igz-sort-dropdown class="igz-component pull-left" data-sort-options="$ctrl.sortOptions" data-reverse-sorting="$ctrl.isReverseSorting" data-update-data-callback="$ctrl.onSortOptionsChange" data-uib-tooltip="{{ \'common:TOOLTIP.SORT\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="top"></igz-sort-dropdown></div></div></div><igz-actions-panes data-filters-toggle-method="$ctrl.toggleFilters()" data-filters-counter="$ctrl.filtersCounter" data-show-filter-icon="true" data-is-filters-opened="$ctrl.isFiltersShowed.value"></igz-actions-panes></div></igz-info-page-actions-bar><igz-info-page-content class="igz-component"><div class="common-table"><div class="common-table-header"><igz-action-checkbox-all data-ng-class="{\'invisible\': !$ctrl.isDemoMode()}" class="common-table-cell check-all-rows" data-items-count="$ctrl.getVersions().length"></igz-action-checkbox-all><div class="igz-row common-table-cells-container"><div class="igz-col-{{$ctrl.isDemoMode() ? \'20\' : \'25\'}} common-table-cell sortable" data-ng-class="$ctrl.getColumnSortingClasses(\'metadata.name\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'metadata.name\')">{{ \'common:NAME\' | i18next }}<span class="sort-arrow"></span></div><div class="igz-col-20 common-table-cell sortable" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.description\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.description\')">{{ \'common:DESCRIPTION\' | i18next }}<span class="sort-arrow"></span></div><div class="igz-col-10 common-table-cell sortable" data-ng-class="$ctrl.getColumnSortingClasses(\'status.state\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'status.state\')">{{ \'common:STATUS\' | i18next }}<span class="sort-arrow"></span></div><div class="igz-col-10 common-table-cell sortable" data-ng-if="$ctrl.isDemoMode()" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.replicas\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.replicas\')">{{ \'common:REPLICAS\' | i18next }}<span class="sort-arrow"></span></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{ \'functions:INVOCATION_PER_SEC\' | i18next }}</div><div class="igz-col-10 common-table-cell sortable" data-ng-class="$ctrl.getColumnSortingClasses(\'spec.runtime\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.runtime\')">{{ \'functions:RUNTIME\' | i18next }}<span class="sort-arrow"></span></div><div class="igz-col-{{$ctrl.isDemoMode() ? \'10\' : \'35\'}} common-table-cell">{{ \'functions:INVOCATION_URL\' | i18next }}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{ \'common:LAST_MODIFIED\' | i18next }}</div></div><div class="common-table-cell actions-menu">&nbsp;</div></div><div class="search-input-not-found" data-ng-if="$ctrl.isFunctionsListEmpty()">{{ \'functions:FUNCTIONS_NOT_FOUND\' | i18next }}</div><div class="common-table-body"><div data-igz-extend-background><div class="igz-scrollable-container" id="dataLifecycleSortableArea" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.configScrollbar()"><div class="sortable-wrapper" data-ng-hide="$ctrl.searchStates.searchNotFound && $ctrl.searchStates.searchInProgress" data-ng-model="$ctrl.data.working.ui.children"><div class="data-lifecycle-layers" data-ng-repeat="aFunction in $ctrl.functions track by aFunction.metadata.name"><div data-igz-show-hide-search-item="aFunction"><ncl-function-collapsing-row data-function="aFunction" data-project="$ctrl.project" data-is-splash-showed="$ctrl.isSplashShowed" data-external-address="$ctrl.externalIPAddress" data-functions-list="$ctrl.functions" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItems)" data-handle-delete-function="$ctrl.deleteFunction({functionData: functionData})" data-on-update-function="$ctrl.onUpdateFunction({function: function, projectID: projectID})" data-get-function="$ctrl.getFunction({metadata: metadata, projectID: projectID})" data-get-functions="$ctrl.getFunctions({id: id})" data-refresh-functions-list="$ctrl.refreshFunctions()"></ncl-function-collapsing-row></div></div></div></div></div></div></div></igz-info-page-content></section>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/components/monaco/text-size-dropdown/text-size-dropdown.tpl.html',
    '<div class="igz-action-panel"><div class="actions-list"><div class="igz-custom-dropdown ncl-text-size-dropdown dropdown" data-uib-dropdown data-is-open="$ctrl.isOpen"><div class="igz-action-item text-size-action-item" data-ng-class="{\'subtemplate-show\': $ctrl.isOpen}" data-uib-dropdown-toggle data-uib-tooltip="{{ \'functions:TOOLTIP.CHANGE_TEXT_SIZE\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000"><span class="action-icon igz-icon-format-size"></span><span class="action-icon igz-icon-decrease"></span></div><ul class="dropdown-menu dropdown-list" data-ng-if="$ctrl.isOpen"><li class="dropdown-menu-item" data-ng-repeat="textSize in $ctrl.textSizes" data-ng-click="$ctrl.changeTextSize(textSize.value)"><span class="item-name" data-ng-class="{\'active-item\': $ctrl.selectedTextSize === textSize.value}">{{textSize.label}}</span></li></ul></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/screens/create-function/function-from-scratch/function-from-scratch.tpl.html',
    '<div class="function-from-scratch-content"><div class="title-wrapper"><span class="title">{{ \'functions:START_FROM_SCRATCH\' | i18next }}</span></div><div class="function-configuration"><form name="$ctrl.functionFromScratchForm" class="configuration-form" novalidate><div class="function-name-wrapper"><div class="projects-drop-down" data-ng-if="$ctrl.isProjectsDropDownVisible()"><span class="input-label">{{ \'common:PROJECTS\' | i18next }}*</span><igz-default-dropdown data-is-required="true" data-values-array="$ctrl.projectsList" data-selected-item="$ctrl.selectedProject" data-item-select-callback="$ctrl.onProjectChange(item, isItemChanged)" data-form-object="$ctrl.functionFromScratchForm" data-input-name="project"><div class="transcluded-item" data-ng-click="$ctrl.createNewProject()">{{ \'functions:NEW_PROJECT\' | i18next }}</div></igz-default-dropdown></div><div class="function-name"><span class="input-label">{{ \'common:NAME\' | i18next }}*</span><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="name" data-input-value="$ctrl.functionData.metadata.name" data-validation-is-required="true" data-validation-pattern="$ctrl.validationPatterns.functionName" data-validation-max-length="{{$ctrl.validationPatterns.getMaxLength(\'function.name\')}}" data-hide-counter="false" data-input-model-options="$ctrl.inputModelOptions" data-form-object="$ctrl.functionFromScratchForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_FUNCTION_NAME\' | i18next }}" data-uib-tooltip="{{ \'functions:TOOLTIP.PROJECT_FUNCTION_NAME\' | i18next }}" data-tooltip-popup-delay="500" data-tooltip-append-to-body="true"></igz-validating-input-field></div></div><div class="function-runtime-wrapper"><div class="function-runtime"><span class="input-label">{{ \'functions:RUNTIME\' | i18next }}*</span><igz-default-dropdown data-is-required="true" data-values-array="$ctrl.runtimes" data-selected-item="$ctrl.selectedRuntime" data-item-select-callback="$ctrl.onRuntimeChange(item, isItemChanged)" data-form-object="$ctrl.functionFromScratchForm" data-input-name="runtime"></igz-default-dropdown><div class="bottom-bar"><button class="ncl-primary-button" data-ng-click="$ctrl.createFunction()" data-ng-disabled="!$ctrl.isCreateFunctionAllowed()" data-ng-class="{\'disabled\': !$ctrl.isCreateFunctionAllowed()}">{{ \'functions:CREATE_FUNCTION\' | i18next }}</button></div></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/screens/create-function/function-import/function-import.tpl.html',
    '<div class="function-import-wrapper-content"><form name="$ctrl.functionImportForm" class="function-import-form" novalidate><div class="projects-drop-down" data-ng-if="$ctrl.isProjectsDropDownVisible()"><span class="input-label">{{ \'functions:PROJECT\' | i18next }}*</span><igz-default-dropdown data-is-required="true" data-values-array="$ctrl.projectsList" data-selected-item="$ctrl.selectedProject" data-item-select-callback="$ctrl.onProjectChange(item, isItemChanged)" data-form-object="$ctrl.functionImportForm" data-input-name="project"><div class="transcluded-item" data-ng-click="$ctrl.createNewProject()">{{ \'functions:NEW_PROJECT\' | i18next }}</div></igz-default-dropdown></div><div class="function-import-actions-bar"><div class="function-import-file-picker"><label class="file-picker-wrapper ncl-primary-button" for="function-import"><span class="igz-icon-upload"></span>{{ \'functions:IMPORT\' | i18next }}</label><input class="function-import-input" type="file" id="function-import" accept=".yml, .yaml"></div><button class="ncl-primary-button" data-ng-click="$ctrl.createFunction()" data-ng-disabled="!$ctrl.isCreateFunctionAllowed()" data-ng-class="{\'disabled\': !$ctrl.isCreateFunctionAllowed()}">{{ \'functions:CREATE_FUNCTION\' | i18next }}</button></div></form><div class="function-import-monaco"><ncl-monaco class="monaco-code-editor" data-function-source-code="$ctrl.sourceCode" data-mini-monaco="false" data-selected-theme="$ctrl.editorTheme" data-language="\'yaml\'" data-read-only="true"></ncl-monaco></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/screens/create-function/function-from-template/function-from-template.tpl.html',
    '<div class="function-from-template-content"><div class="templates-wrapper"><span class="title">{{ \'functions:CHOOSE_TEMPLATE\' | i18next }}</span><div class="templates-controls"><div class="templates-search-input"><div class="igz-icon-search search-icon"></div><input class="input-field field" tabindex="0" data-ng-model="$ctrl.searchQuery" data-ng-change="$ctrl.onChangeSearchQuery()" placeholder="{{ \'functions:PLACEHOLDER.SEARCH_TEMPLATE\' | i18next }}" data-igz-input-blur-on-enter></div><div class="templates-runtime-drop-down"><span class="input-label">{{ \'functions:RUNTIME\' | i18next }}</span><igz-default-dropdown data-values-array="$ctrl.runtimeFilters" data-selected-item="$ctrl.selectedRuntimeFilter" data-item-select-callback="$ctrl.onRuntimeFilterChange(item, isItemChanged)"></igz-default-dropdown></div><div class="templates-pagination"><igz-pagination data-page-data="$ctrl.page" data-is-per-page-visible="true" data-pagination-callback="$ctrl.paginationCallback(page, size)"></igz-pagination></div></div><div class="function-templates"><form name="$ctrl.functionFromTemplateForm" class="function-templates-form" novalidate><div class="function-template-wrapper" data-ng-repeat="(key, value) in $ctrl.templatesWorkingCopy track by $index" data-ng-class="{\'selected\': $ctrl.isTemplateSelected(key)}" data-ng-click="$ctrl.selectTemplate(key)"><div class="function-template"><div data-ng-show="!$ctrl.isTemplateSelected(key)" class="function-template-content"><div class="template-title">{{key}}</div><div class="template-description">{{value.rendered.spec.description}}</div><div data-ng-if="value.ui.readMore" class="template-read-more">{{ \'functions:READ_MORE\' | i18next }}...</div></div><div data-ng-show="$ctrl.isTemplateSelected(key)" class="function-template-content"><ng-form name="templateForm"><div data-ng-if="$ctrl.isProjectsDropDownVisible()" class="projects-drop-down"><span class="input-label">{{ \'common:PROJECTS\' | i18next }}</span><igz-default-dropdown data-is-required="true" data-values-array="$ctrl.projectsList" data-selected-item="$ctrl.selectedProject" data-item-select-callback="$ctrl.onProjectChange(item, isItemChanged)" data-form-object="$ctrl.functionFromTemplateForm" data-input-name="project"><div class="transcluded-item" data-ng-click="$ctrl.createNewProject()">{{ \'functions:NEW_PROJECT\' | i18next }}</div></igz-default-dropdown></div><div class="function-name"><span class="input-label">{{ \'common:NAME\' | i18next }}</span><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="name" data-input-value="$ctrl.functionName" data-validation-is-required="true" data-form-object="$ctrl.functionFromTemplateForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-validation-pattern="$ctrl.validationPatterns.functionName" data-validation-max-length="{{$ctrl.validationPatterns.getMaxLength(\'function.name\')}}" data-hide-counter="false" data-input-model-options="$ctrl.inputModelOptions" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_FUNCTION_NAME\' | i18next }}..." data-uib-tooltip="{{ \'functions:TOOLTIP.PROJECT_FUNCTION_NAME\' | i18next }}" data-tooltip-popup-delay="500" data-tooltip-append-to-body="true"></igz-validating-input-field></div><div class="buttons-wrapper"><button class="ncl-secondary-button" data-ng-click="$ctrl.unselectTemplate($event)">{{ \'common:CANCEL\' | i18next }}</button><button class="ncl-primary-button" data-ng-click="$ctrl.createFunction()" data-ng-class="{\'disabled\': !$ctrl.isCreateFunctionAllowed()}">{{ \'common:CREATE\' | i18next }}</button></div></ng-form></div></div></div></form></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/duplicate-function-dialog/duplicate-function-dialog.tpl.html',
    '<div class="close-button igz-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title">{{ \'functions:DUPLICATE_FUNCTION\' | i18next }}</div><div class="main-content"><form name="$ctrl.duplicateFunctionForm" novalidate data-ng-keydown="$ctrl.duplicateFunction($event)"><div class="field-group function-name-group"><div class="field-label function-name-label">{{ \'functions:FUNCTION_NAME\' | i18next }}</div><div class="field-input function-name-input"><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="spec.displayName" data-input-value="$ctrl.newFunctionName" data-is-focused="true" data-form-object="$ctrl.duplicateFunctionForm" data-update-data-callback="$ctrl.inputValueCallback(newData)" data-validation-is-required="true" data-validation-pattern="$ctrl.validationPatterns.functionName" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_FUNCTION_NAME\' | i18next }}" data-validation-max-length="{{$ctrl.validationPatterns.getMaxLength(\'function.name\')}}" data-uib-tooltip="{{ \'functions:TOOLTIP.PROJECT_FUNCTION_NAME\' | i18next }}" data-tooltip-popup-delay="500" data-tooltip-append-to-body="true"></igz-validating-input-field><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState($ctrl.duplicateFunctionForm, \'spec.displayName\')">{{ \'common:ERROR_MSG.INVALID_INPUTS\' | i18next }}</div><div class="error" data-ng-show="$ctrl.nameTakenError">{{ \'common:ERROR_MSG.NAME_EXISTS\' | i18next }}</div></div></div></form></div><div class="buttons"><button class="ncl-secondary-button" data-test-id="functions.duplicate_function_cancel.button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">{{ \'common:CANCEL\' | i18next }}</button><button class="ncl-primary-button" data-test-id="functions.duplicate_function_duplicate.button" tabindex="0" data-ng-click="$ctrl.duplicateFunction()" data-ng-keydown="$ctrl.duplicateFunction($event)" data-ng-hide="$ctrl.isLoadingState">{{ \'common:DUPLICATE\' | i18next }}</button><button class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">{{ \'common:LOADING_CAPITALIZE_ELLIPSIS\' | i18next }}</button></div><div class="error-text text-centered error-relative" data-ng-show="$ctrl.isServerError()">{{ \'common:ERROR\' | i18next }}:&nbsp;{{$ctrl.serverError}}</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/function/ncl-function.tpl.html',
    '<section data-igz-extend-background data-ui-view="function"></section>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/function-collapsing-row/function-collapsing-row.tpl.html',
    '<div class="ncl-function-collapsing-row items-wrapper"><div class="scrolling-row"></div><div class="function-title-block common-table-row"><div class="common-table-cell function-row-collapse"><span data-ng-if="$ctrl.function.spec.version > -1" class="collapse-icon" data-ng-click="$ctrl.isCollapsed = !$ctrl.isCollapsed" data-ng-class="{\'collapsed igz-icon-right\': $ctrl.isCollapsed, \'igz-icon-down\': !$ctrl.isCollapsed}"></span></div><div class="igz-row common-table-cells-container" data-ng-click="$ctrl.onSelectRow($event)"><div class="igz-col-{{$ctrl.isDemoMode() ? \'20\' : \'25\'}} common-table-cell function-name">{{$ctrl.function.metadata.name}}</div><div class="igz-col-20 common-table-cell" data-uib-tooltip="{{$ctrl.function.spec.description}}" data-tooltip-append-to-body="true" data-tooltip-placement="top"><span class="description-content common-table-cell-content" data-ng-bind="$ctrl.function.spec.description" data-igz-multiline-ellipsis></span></div><div class="igz-col-10 common-table-cell">{{$ctrl.convertedStatusState}}<div class="status-icon" data-uib-tooltip="{{$ctrl.getTooltip()}}" data-tooltip-append-to-body="true" data-tooltip-placement="top" data-ng-class="$ctrl.statusIcon" data-ng-click="$ctrl.toggleFunctionState($event)"></div></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{$ctrl.function.spec.replicas}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{$ctrl.function.spec.invocation || 0}}</div><div class="igz-col-10 common-table-cell">{{$ctrl.runtimes[$ctrl.function.spec.runtime]}}</div><div class="igz-col-{{$ctrl.isDemoMode() ? \'10\' : \'25\'}} common-table-cell" data-uib-tooltip="{{$ctrl.invocationURL}}" data-tooltip-append-to-body="true" data-tooltip-placement="top"><span class="common-table-cell-content">{{$ctrl.invocationURL}}</span></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{$ctrl.function.attr.last_modified | date:"MMM dd, yyyy"}}</div></div><div class="common-table-cell actions-menu"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div></div><div class="items-wrapper" data-uib-collapse="$ctrl.isCollapsed"><div data-ng-repeat="version in $ctrl.function.versions"><ncl-function-version-row class="function-version-wrapper" data-version="version" data-function="$ctrl.function" data-project="$ctrl.project" data-versions-list="$ctrl.function.attr.versions" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItems)"></ncl-function-version-row></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version.tpl.html',
    '<div class="ncl-edit-version"><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><igz-info-page-actions-bar class="igz-component border-top"><div class="actions-bar-right"><div class="actions-bar-left actions-buttons-block actions-dropdown-block"><igz-default-dropdown data-select-property-only="id" data-placeholder="{{ \'functions:PLACEHOLDER.ACTIONS\' | i18next }}" data-values-array="$ctrl.actions" data-is-disabled="!$ctrl.isFunctionDeployed" data-item-select-callback="$ctrl.onSelectAction(item)" data-skip-selection="true"></igz-default-dropdown></div><div class="actions-bar-left actions-buttons-block"><button class="ncl-new-entity-button" data-ng-class="{\'disabled\': $ctrl.isInValidDeployState() || $ctrl.isDeployDisabled}" data-ng-click="$ctrl.isInValidDeployState() || $ctrl.deployButtonClick($event)">{{ \'functions:DEPLOY\' | i18next }}</button></div></div></igz-info-page-actions-bar><div data-ng-if="$ctrl.isDeployResultShown" class="ncl-edit-version-execution-result deploy-result" data-ng-class="{\'in-progress\': $ctrl.isInValidDeployState(),\n' +
    '                         \'failed\'     : $ctrl.deployResult.status.state === \'error\'}"><div class="btn-close igz-icon-close" data-ng-if="!$ctrl.isInValidDeployState()" data-ng-click="$ctrl.toggleDeployResult()"></div><div class="icon-collapsed general-content" data-ng-class="$ctrl.rowIsCollapsed.deployBlock ? \'igz-icon-right\' : \'igz-icon-down\'" data-ng-click="$ctrl.onRowCollapse(\'deployBlock\')"></div><div class="ncl-execution-result-status" data-ng-class="{\'succeeded\'  : $ctrl.deployResult.status.state === \'ready\',\n' +
    '                             \'in-progress\': $ctrl.isInValidDeployState(),\n' +
    '                             \'collapsed\'  : $ctrl.rowIsCollapsed.deployBlock}"><span class="result-status-icon" data-ng-class="{\'igz-icon-tick-round\' : $ctrl.deployResult.status.state === \'ready\',\n' +
    '                                  \'igz-icon-properties\' : $ctrl.isInValidDeployState(),\n' +
    '                                  \'igz-icon-block\'      : $ctrl.deployResult.status.state === \'error\'}"></span><span class="result-state">{{$ctrl.getDeployStatusState($ctrl.deployResult.status.state)}}</span></div><div class="ncl-execution-result-block collapsed-block-content-wrapper" data-uib-collapse="$ctrl.rowIsCollapsed.deployBlock"><div class="collapsed-block-title without-collapse">{{ \'common:LOGS\' | i18next }}</div><ncl-deploy-log data-log-entires="$ctrl.deployResult.status.logs"></ncl-deploy-log></div></div><ncl-navigation-tabs data-tab-items="$ctrl.navigationTabsConfig" data-version="$ctrl.version" data-ng-class="{\'ncl-version-configuration-tabs\': $ctrl.getCurrentStateName() === \'app.project.function.edit.configuration\'}"></ncl-navigation-tabs><section class="ncl-edit-version-view" data-igz-extend-background data-ui-view="version"></section></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/common/screens/create-function/function-from-template/function-from-template-dialog/function-from-template-dialog.tpl.html',
    '<div class="close-button ncl-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>{{ \'functions:TEMPLATE_PARAMETERS\' | i18next }}</span></div><div class="main-content igz-scrollable-container" data-ng-scrollbars><form name="$ctrl.templateForm" novalidate><div class="field-group align-items-center" data-ng-repeat="field in $ctrl.fields track by field.name"><div class="igz-col-40 field-label">{{ field.displayName }}<span class="asterisk" data-ng-if="field.required"></span></div><div class="igz-col-55"><igz-validating-input-field class="nuclio-validating-input" data-ng-if="field.kind === \'string\'" data-field-type="{{field.attributes.password ? \'password\' : \'input\'}}" data-validation-is-required="field.required" data-input-value="field.attributes.defaultValue" data-input-name="{{field.name}}" data-form-object="$ctrl.templateForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)"></igz-validating-input-field><igz-number-input data-ng-if="field.kind === \'number\'" data-min-value="field.attributes.minValue" data-max-value="field.attributes.maxValue" data-value-step="{{field.attributes.step}}" data-precision="{{field.attributes.allowDecimal ? 2 : 0}}" data-default-value="field.attributes.defaultValue" data-validation-is-required="field.required" data-form-object="$ctrl.templateForm" data-allow-empty-field="true" data-update-number-input-callback="$ctrl.inputValueCallback(newData, field)" data-input-name="{{field.name}}"></igz-number-input><igz-default-dropdown data-ng-if="field.kind === \'choice\'" data-values-array="field.attributes.choices" data-selected-item="field.attributes.defaultValue" data-select-property-only="id" data-is-required="field.required" data-item-select-field="{{field.name}}" data-item-select-callback="$ctrl.dropdownCallback(item, isItemChanged, field)" data-form-object="$ctrl.templateForm" data-input-name="{{field.name}}"></igz-default-dropdown></div><div class="igz-col-5"><igz-more-info data-ng-if="field.description" data-is-default-tooltip-enabled="true" data-default-tooltip-placement="bottom" data-default-tooltip-popup-delay="200" data-description="{{field.description}}"></igz-more-info></div></div></form></div><div class="buttons"><button class="ncl-secondary-button" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">{{ \'common:CANCEL\' | i18next }}</button><button class="ncl-primary-button" data-ng-class="{disabled: !$ctrl.isFormFilled()}" data-ng-disabled="!$ctrl.isFormFilled()" data-ng-click="$ctrl.onApply()" data-ng-keydown="$ctrl.onApply($event)">{{ \'common:APPLY\' | i18next }}</button></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/function-collapsing-row/function-version-row/function-version-row.tpl.html',
    '<div class="ncl-function-version-row common-table-row"><div data-ng-class="{\'invisible\': !$ctrl.isDemoMode()}" class="common-table-cell check-row"><igz-action-checkbox data-item="$ctrl.version"></igz-action-checkbox></div><div class="igz-row common-table-cells-container" data-ng-click="$ctrl.onSelectRow($event)"><div class="igz-col-25 common-table-cell">{{$ctrl.version.name}}</div><div class="igz-col-45 common-table-cell empty"></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell invocation">{{$ctrl.version.invocation}}</div><div class="igz-col-10 common-table-cell empty"></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell created-date">{{$ctrl.version.last_modified | date:"MMM dd, yyyy"}}</div></div><div class="common-table-cell actions-menu"><igz-action-menu data-ng-if="$ctrl.isDemoMode()" data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/function-event-dialog/function-event-dialog.tpl.html',
    '<div class="function-event-wrapper"><div class="header"><div class="title">{{$ctrl.titleText}}</div><div class="close-button igz-icon-close" data-ng-click="$ctrl.closeEventDialog()"></div></div><div class="content"><form name="$ctrl.functionEventForm" class="event-form"><div class="field-wrapper"><div class="field-label">{{ \'common:NAME\' | i18next }}</div><div class="field-content"><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="displayName" data-input-model-options="$ctrl.inputModelOptions" data-input-value="$ctrl.workingCopy.spec.displayName" data-validation-is-required="true" data-form-object="$ctrl.functionEventForm" data-update-data-callback="$ctrl.inputValueCallback(newData, \'displayName\')" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_NAME_OF_EVENT\' | i18next }}"></igz-validating-input-field></div></div><div class="field-wrapper"><div class="field-label">{{ \'functions:METHOD\' | i18next }}</div><div class="field-content"><igz-default-dropdown data-values-array="$ctrl.methods" data-selected-item="$ctrl.selectedMethod" data-item-select-callback="$ctrl.onSelectMethod(item, isItemChanged, field)" data-is-required="true" data-form-object="$ctrl.functionEventForm"></igz-default-dropdown></div></div><div class="field-wrapper"><div class="field-label">{{ \'common:PATH\' | i18next }}</div><div class="field-content"><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="path" data-input-model-options="$ctrl.inputModelOptions" data-input-value="$ctrl.workingCopy.spec.attributes.path" data-form-object="$ctrl.functionEventForm" data-update-data-callback="$ctrl.inputValueCallback(newData, \'path\')" data-placeholder-text="{{ \'common:PLACEHOLDER.ENTER_PATH\' | i18next }}"></igz-validating-input-field></div></div><div class="field-wrapper"><div class="field-label">{{ \'functions:CONTENT_TYPE\' | i18next }}</div><div class="field-content"><igz-default-dropdown data-values-array="$ctrl.headers" data-selected-item="$ctrl.selectedHeader" data-item-select-callback="$ctrl.onSelectHeader(item, isItemChanged, field)" data-is-required="true" data-form-object="$ctrl.functionEventForm"></igz-default-dropdown></div></div><div class="field-wrapper"><div class="field-label">{{ \'functions:BODY\' | i18next }}</div><div data-ng-if="$ctrl.contentType === \'application/json\'" class="field-content code-edit-section"><ncl-monaco data-function-source-code="$ctrl.workingCopy.spec.body" data-selected-theme="$ctrl.bodyTheme" data-language="json" data-mini-monaco="true" data-on-change-source-code-callback="$ctrl.onChangeSourceCode(sourceCode)" data-read-only="false"></ncl-monaco></div><div data-ng-if="$ctrl.contentType === \'text/plain\'" class="field-content"><textarea class="event-body" data-ng-model="$ctrl.workingCopy.spec.body" data-ng-change="$ctrl.onChangeBody()" data-form-object="$ctrl.functionEventForm" placeholder="{{ \'functions:PLACEHOLDER.ENTER_BODY_OF_EVENT\' | i18next }}">\n' +
    '                    </textarea></div></div></form><div class="event-error" data-ng-if="$ctrl.isDeployFailed">{{$ctrl.errorText}}</div></div><div class="bottom-bar"><div class="ncl-secondary-button" data-ng-click="$ctrl.closeEventDialog()">{{ \'common:CANCEL\' | i18next }}</div><div class="ncl-primary-button" tabindex="0" data-ng-class="{\'disabled\' : !$ctrl.isFormChanged}" data-ng-click="$ctrl.applyChanges()" data-ng-keydown="$ctrl.applyChanges($event)" data-ng-hide="$ctrl.isLoadingState">{{$ctrl.buttonText}}</div><div class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">{{ \'common:LOADING_CAPITALIZE_ELLIPSIS\' | i18next }}</div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-code/version-code.tpl.html',
    '<div data-ui-layout="{ flow : \'column\', dividerSize: 3 }" class="ncl-edit-version-code ncl-version"><div ui-layout-container min-size="200px" class="code-section"><form name="$ctrl.versionCodeForm" class="code-wrapper-block" igz-extend-background><div data-ng-if="$ctrl.selectedEntryType.id === \'sourceCode\'" class="igz-scrollable-container code-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfigHorizontal"><div class="ncl-edit-version-code-wrapper"><div class="section-wrapper code-entry-section"><div class="code-entry-row"><div class="code-entry-col code-entry-type-col"><div class="col-label code-entry-type">{{ \'functions:CODE_ENTRY_TYPE\' | i18next }}</div><igz-default-dropdown data-values-array="$ctrl.codeEntryTypeArray" data-item-select-callback="$ctrl.selectEntryTypeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedEntryType"></igz-default-dropdown></div><div class="code-entry-col code-entry-runtime-col"><div class="col-label runtime">{{ \'functions:RUNTIME\' | i18next }}</div><igz-default-dropdown data-values-array="$ctrl.runtimeArray" data-item-select-callback="$ctrl.selectRuntimeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedRuntime" data-is-disabled="true"></igz-default-dropdown></div><div class="code-entry-col code-entry-handler-col"><div class="col-label handler">{{ \'functions:HANDLER\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="handler" data-input-value="$ctrl.version.spec.handler" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.handler" data-form-object="$ctrl.versionCodeForm" data-placeholder-text="{{ \'functions:HANDLER\' | i18next }}"></igz-validating-input-field></div><div class="code-entry-col code-entry-theme-col" data-ng-if="$ctrl.isDemoMode()"><div class="col-label runtime">{{ \'functions:THEME\' | i18next }}</div><igz-default-dropdown data-values-array="$ctrl.themesArray" data-item-select-callback="$ctrl.selectThemeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedTheme" data-on-close-dropdown="$ctrl.onCloseDropdown()"></igz-default-dropdown></div></div></div><div class="code-edit-section"><div class="code-editor-drop-zone"></div><ncl-monaco class="monaco-code-editor" igz-extend-background data-function-source-code="$ctrl.sourceCode" data-mini-monaco="false" data-selected-theme="$ctrl.selectedTheme.id" data-show-text-size-dropdown="true" data-language="$ctrl.editorLanguage" data-on-change-source-code-callback="$ctrl.onChangeSourceCode(sourceCode, language)" data-read-only="false"></ncl-monaco></div></div></div><div data-ng-if="$ctrl.selectedEntryType.id !== \'sourceCode\'" class="igz-scrollable-container code-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="ncl-edit-version-code-wrapper"><div class="section-wrapper code-entry-section"><div class="code-entry-row"><div class="code-entry-col code-entry-type-col"><div class="col-label code-entry-type">{{ \'functions:CODE_ENTRY_TYPE\' | i18next }}</div><igz-default-dropdown data-values-array="$ctrl.codeEntryTypeArray" data-item-select-callback="$ctrl.selectEntryTypeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedEntryType"></igz-default-dropdown></div><div class="code-entry-col code-entry-runtime-col"><div class="col-label runtime">{{ \'functions:RUNTIME\' | i18next }}</div><igz-default-dropdown data-values-array="$ctrl.runtimeArray" data-item-select-callback="$ctrl.selectRuntimeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedRuntime" data-is-disabled="true"></igz-default-dropdown></div><div class="code-entry-col code-entry-handler-col"><div class="col-label handler">{{ \'functions:HANDLER\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="handler" data-input-value="$ctrl.version.spec.handler" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.handler" data-form-object="$ctrl.versionCodeForm" data-placeholder-text="{{ \'functions:HANDLER\' | i18next }}"></igz-validating-input-field></div></div></div><div data-ng-if="$ctrl.selectedEntryType.id === \'image\'" class="ncl-code-entry-url"><div class="field-label">{{ \'common:URL\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="image" data-input-value="$ctrl.version.spec.image" data-is-focused="true" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="true" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_IMAGE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.image" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'archive\' || $ctrl.selectedEntryType.id === \'jar\'" class="ncl-code-entry-url"><div class="field-label">{{ \'common:URL\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="archive" data-input-value="$ctrl.version.spec.build.path" data-is-focused="true" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="true" data-placeholder-text="{{ \'common:FOR_EXAMPLE\' | i18next }}: http://example.com:1234/path/to/file" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.path" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'archive\'" class="ncl-code-entry-url"><div class="field-label">{{ \'functions:WORK_DIRECTORY\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="archiveWorkDir" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.workDir" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="{{ \'common:FOR_EXAMPLE\' | i18next }}: /path/to/functions/in/archive" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.workDir" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:ACCESS_KEY_V3IO_ONLY\' | i18next }}</div><igz-validating-input-field data-field-type="password" data-input-name="sessionKey" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.headers[\'X-V3io-Session-Key\']" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_ACCESS_KEY\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.headers[\'X-V3io-Session-Key\']" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'github\'" class="ncl-code-entry-url"><div class="field-label">{{ \'common:URL\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="githubUrl" data-input-value="$ctrl.version.spec.build.path" data-is-focused="true" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="true" data-placeholder-text="{{ \'common:FOR_EXAMPLE\' | i18next }}: https://github.com/nuclio/nuclio" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.path" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'github\'" class="ncl-code-entry-url"><div class="field-label">{{ \'functions:TOKEN\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="githubToken" data-input-value="$ctrl.githubToken" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="{{ \'common:FOR_EXAMPLE\' | i18next }}: 22e3ce5d1aad5e3b88db76df133674ae6da24591" data-update-data-callback="$ctrl.onChangeGithubToken(newData)" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'github\'" class="ncl-code-entry-url"><div class="field-label">{{ \'functions:BRANCH\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="githubBranch" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.branch" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="true" data-placeholder-text="{{ \'common:FOR_EXAMPLE\' | i18next }}: master" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.branch" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'github\'" class="ncl-code-entry-url"><div class="field-label">{{ \'functions:WORK_DIRECTORY\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="githubWorkDir" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.workDir" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="{{ \'common:FOR_EXAMPLE\' | i18next }}: /path/to/functions" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.workDir" class="nuclio-validating-input"></igz-validating-input-field></div><div data-ng-if="$ctrl.selectedEntryType.id === \'s3\'" class="ncl-code-entry-s3"><div class="field-label">{{ \'functions:BUCKET\' | i18next }}<span class="asterisk"></span></div><igz-validating-input-field data-field-type="input" data-input-name="s3Bucket" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.s3Bucket" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="true" data-placeholder-text="my-bucket-name" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.s3Bucket" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:ITEM_KEY\' | i18next }}<span class="asterisk"></span></div><igz-validating-input-field data-field-type="input" data-input-name="s3ItemKey" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.s3ItemKey" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="true" data-placeholder-text="my-dir/nuclio_funcs.zip" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.s3ItemKey" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:ACCESS_KEY_ID\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="s3AccessKeyID" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.s3AccessKeyId" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="myaccesskeyid" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.s3AccessKeyId" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:SECRET_ACCESS_KEY\' | i18next }}</div><igz-validating-input-field data-field-type="password" data-input-name="s3SecretAccessKey" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.s3SecretAccessKey" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="mysecretaccesskey" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.s3SecretAccessKey" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:REGION\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="s3Region" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.s3Region" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="myregion" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.s3Region" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:SESSION_TOKEN\' | i18next }}</div><igz-validating-input-field data-field-type="password" data-input-name="s3SessionToken" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.s3SessionToken" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="mys3sessiontoken" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.s3SessionToken" class="nuclio-validating-input"></igz-validating-input-field><div class="field-label">{{ \'functions:WORK_DIRECTORY\' | i18next }}</div><igz-validating-input-field data-field-type="input" data-input-name="workDir" data-input-value="$ctrl.version.spec.build.codeEntryAttributes.workDir" data-is-focused="false" data-form-object="$ctrl.versionCodeForm" data-validation-is-required="false" data-placeholder-text="path/to/functions/in/archive" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.codeEntryAttributes.workDir" class="nuclio-validating-input"></igz-validating-input-field></div></div></div></form></div><div ui-layout-container size="650px" min-size="200px" class="event-pane-section"><function-events-data-wrapper data-version="$ctrl.version"></function-events-data-wrapper></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/version-configuration.tpl.html',
    '<div class="ncl-version-configuration ncl-version" data-igz-extend-background><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="ncl-version-configuration-wrapper"><div class="row"><ncl-version-configuration-basic-settings class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-basic-settings><ncl-version-configuration-resources class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-resources></div><div class="row"><ncl-version-configuration-environment-variables class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-environment-variables></div><div class="row"><ncl-version-configuration-labels class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-labels><ncl-version-configuration-annotations class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-annotations></div><div class="row"><ncl-version-configuration-volumes class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback()"></ncl-version-configuration-volumes><ncl-version-configuration-build class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-build></div><div class="row"><ncl-version-configuration-logging data-ng-if="false" class="configuration-block" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-logging><ncl-version-configuration-runtime-attributes data-ng-if="$ctrl.isRuntimeBlockVisible()" class="configuration-block runtime-attributes" data-version="$ctrl.version" data-on-change-callback="$ctrl.onConfigurationChangeCallback"></ncl-version-configuration-runtime-attributes><div data-ng-if="$ctrl.isRuntimeBlockVisible()" class="configuration-block invisible"></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-monitoring/version-monitoring.tpl.html',
    '<div class="ncl-version-monitoring ncl-version" data-igz-extend-background><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="ncl-version-monitoring-wrapper"><div class="row"><div class="monitoring-block"><span class="monitoring-block-title">{{ \'functions:INVOCATION_URL\' | i18next }}:</span><a data-ng-if="$ctrl.version.status.state === \'ready\' && $ctrl.version.ui.invocationURL !== \'\'" class="monitoring-invocation-url" href="{{$ctrl.version.ui.invocationURL}}">{{$ctrl.version.ui.invocationURL}}</a><span data-ng-if="$ctrl.version.status.state === \'ready\' && $ctrl.version.ui.invocationURL === \'\'" class="monitoring-invocation-field-invalid">N/A</span><span data-ng-if="$ctrl.version.status.state !== \'ready\'" class="monitoring-invocation-field-invalid">{{ \'functions:NOT_YET_DEPLOYED\' | i18next }}</span></div><div class="monitoring-block" data-ng-if="$ctrl.isDemoMode()"><span class="monitoring-block-title">{{ \'common:REPLICAS\' | i18next }}:</span><span data-ng-if="$ctrl.version.status.state === \'ready\' && $ctrl.version.spec.maxReplicas !== 0" class="monitoring-replicas">{{$ctrl.version.status.replicas}}/{{$ctrl.version.spec.maxReplicas}}</span><span data-ng-if="$ctrl.version.status.state === \'ready\' && $ctrl.version.spec.maxReplicas === 0" class="monitoring-replicas">{{$ctrl.version.status.replicas}}/{{$ctrl.version.status.replicas}}</span><span data-ng-if="$ctrl.version.status.state !== \'ready\'" class="monitoring-invocation-field-invalid">{{ \'functions:NOT_YET_DEPLOYED\' | i18next }}</span></div></div><div class="row"><div class="monitoring-block ncl-monitoring-build-logger"><span class="icon-collapsed general-content" data-ng-class="$ctrl.rowIsCollapsed.buildLog ? \'igz-icon-right\' : \'igz-icon-down\'" data-ng-click="$ctrl.onRowCollapse(\'buildLog\')"></span><span class="monitoring-block-title">{{ \'functions:BUILD_LOG\' | i18next }}</span><div class="ncl-monitoring-build-logs collapsed-block-content-wrapper" data-uib-collapse="$ctrl.rowIsCollapsed.buildLog"><ncl-deploy-log data-log-entires="$ctrl.versionStatus.logs"></ncl-deploy-log></div></div></div><div class="row" data-ng-if="$ctrl.checkIsErrorState()"><div class="monitoring-block ncl-monitoring-error-logger"><span class="icon-collapsed general-content" data-ng-class="$ctrl.rowIsCollapsed.errorLog ? \'igz-icon-right\' : \'igz-icon-down\'" data-ng-click="$ctrl.onRowCollapse(\'errorLog\')"></span><span class="monitoring-block-title">{{ \'common:ERROR\' | i18next }}</span><div class="ncl-monitoring-error-logs collapsed-block-content-wrapper" data-uib-collapse="$ctrl.rowIsCollapsed.errorLog"><div class="error-panel igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="log-entry"><span class="log-entry-error">{{$ctrl.versionStatus.message}}</span></div></div></div></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-triggers/version-triggers.tpl.html',
    '<div class="ncl-version-trigger ncl-version"><div class="common-table"><div data-ng-if="$ctrl.triggers.length > 0" class="common-table-header header-row"><div class="common-table-cell header-name">{{ \'common:NAME\' | i18next }}</div><div class="common-table-cell header-class">{{ \'common:CLASS\' | i18next }}</div><div class="igz-col-70 common-table-cell">{{ \'common:INFO\' | i18next }}</div></div><div class="common-table-body"><div data-igz-extend-background><div class="igz-scrollable-container" data-ng-scrollbars><ncl-collapsing-row data-ng-repeat="trigger in $ctrl.triggers" data-item="trigger" data-type="trigger" data-action-handler-callback="$ctrl.handleAction(actionType, selectedItem)"><ncl-edit-item class="common-table-cells-container edit-trigger-row" data-item="trigger" data-type="trigger" data-default-fields="$ctrl.defaultFields" data-on-submit-callback="$ctrl.editTriggerCallback(item)"></ncl-edit-item></ncl-collapsing-row><div class="common-table-row create-trigger-button" data-ng-click="$ctrl.createTrigger($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_TRIGGER\' | i18next }}</div></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-code/function-event-pane/function-event-pane.tpl.html',
    '<div class="test-events-pane-wrapper"><div class="test-events-pane" data-ng-class="{\'fixed-left-bar\': $ctrl.fixedLeftBar}"><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><div data-ng-class="{\'visible\': $ctrl.showLeftBar}" class="left-bar"><div class="header"><div class="igz-icon-close" data-ng-click="$ctrl.toggleLeftBar(false)"></div>{{ \'common:EVENTS\' | i18next }}<div class="ncl-icon-pin" data-ng-if="!$ctrl.fixedLeftBar" data-ng-click="$ctrl.fixLeftBar()"></div></div><ncl-test-events-navigation-tabs data-active-tab="$ctrl.selectedLeftBarTab" data-tab-items="$ctrl.leftBarNavigationTabs" data-on-change-active-tab="$ctrl.onChangeTab(activeTab, \'selectedLeftBarTab\')"></ncl-test-events-navigation-tabs><div class="saved-tabs-list" data-igz-extend-background><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="list-item" data-ng-if="$ctrl.selectedLeftBarTab.id === \'saved\'" data-ng-repeat="savedEvent in $ctrl.savedEvents"><div class="text-ellipsis" data-ng-click="$ctrl.selectEvent(savedEvent)"><div class="method-icon" data-ng-style="{\'background-color\': $ctrl.getMethodColor(savedEvent.spec.attributes.method)}">{{savedEvent.spec.attributes.method}}</div>{{savedEvent.spec.displayName}}</div><div class="igz-icon-close" data-ng-click="$ctrl.deleteEvent(savedEvent)"></div></div><div class="list-item text-ellipsis" data-ng-if="$ctrl.selectedLeftBarTab.id === \'history\'" data-ng-repeat="savedEvent in $ctrl.history | orderBy:\'-\'" data-ng-click="$ctrl.selectEvent(savedEvent, \'history\')"><span class="method-icon" data-ng-style="{\'background-color\': $ctrl.getMethodColor(savedEvent.spec.attributes.method)}">{{savedEvent.spec.attributes.method}}</span>{{savedEvent.spec.attributes.path === \'\' ? \'/\' : savedEvent.spec.attributes.path}}</div></div></div></div><div class="main-section-wrapper"><form name="$ctrl.testEventsForm"><div class="main-header"><div class="left-side-elements"><span class="igz-icon-hamburger-menu" data-ng-if="!$ctrl.fixedLeftBar" data-ng-click="$ctrl.toggleLeftBar()"></span><igz-elastic-input-field data-model="$ctrl.selectedEvent.spec.displayName" data-model-options="{allowInvalid:true}" data-on-change="$ctrl.inputValueCallback(item, \'spec.displayName\')" data-input-name="nameInput" data-form-object="$ctrl.testEventsForm" data-required="true" data-placeholder="{{ \'functions:PLACEHOLDER.EVENT_NAME\' | i18next }}" data-max-length="128"></igz-elastic-input-field></div><div class="right-side-elements"><button class="new-test-event" data-ng-click="$ctrl.resetData()" data-uib-tooltip="{{ \'functions:TOOLTIP.NEW_TEST\' | i18next }}" data-tooltip-popup-delay="300" data-tooltip-placement="left" data-tooltip-append-to-body="true"><span class="ncl-icon-add"></span></button><button class="igz-button-primary" data-ng-class="{\'disabled\': $ctrl.isDisabledTestButton()}" data-ng-click="$ctrl.testEvent()" data-uib-tooltip="{{$ctrl.version.status.state !== \'ready\' || $ctrl.version.spec.disable ? (\'functions:TOOLTIP.DISABLED_FUNCTION\' | i18next) : \'\'}}" data-tooltip-popup-delay="300" data-tooltip-placement="top" data-tooltip-append-to-body="true">{{ \'functions:TEST\' | i18next }}</button><button class="ncl-secondary-button" data-ng-class="{\'disabled\': $ctrl.uploadingData.name !== \'\'}" data-ng-click="$ctrl.uploadingData.name !== \'\' || $ctrl.saveEvent()">{{ \'common:SAVE\' | i18next }}</button></div></div><div data-ui-layout="{ flow : \'row\', dividerSize: 3 }"><div ui-layout-container size="45%" min-size="100px" class="request-section" data-ng-class="{\'left-bar-pinned\': $ctrl.fixedLeftBar}"><div class="igz-scrollable-container scrollable-request-section" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="request-method"><igz-default-dropdown data-values-array="$ctrl.requestMethods" data-select-property-only="name" data-selected-item="$ctrl.selectedEvent.spec.attributes.method" data-item-select-callback="$ctrl.onChangeRequestMethod(item)" data-enable-overlap="true"></igz-default-dropdown><div class="path">{{$ctrl.getInvocationUrl()}}<igz-validating-input-field data-field-type="input" data-input-value="$ctrl.selectedEvent.spec.attributes.path" data-update-data-field="spec.attributes.path" data-update-data-callback="$ctrl.inputValueCallback(newData, field)"></igz-validating-input-field></div></div><div class="request-body"><ncl-test-events-navigation-tabs data-active-tab="$ctrl.selectedRequestTab" data-tab-items="$ctrl.requestNavigationTabs" data-on-change-active-tab="$ctrl.onChangeTab(activeTab, \'selectedRequestTab\')" data-selected-log-level="$ctrl.eventLogLevel" data-on-change-log-level="$ctrl.onChangeLogLevel(selectedLogLevel)"></ncl-test-events-navigation-tabs><div class="body" data-ng-if="$ctrl.selectedRequestTab.id === \'body\'"><div class="body-types"><igz-default-dropdown data-values-array="$ctrl.requestBodyTypes" data-selected-item="$ctrl.requestBodyType" data-item-select-callback="$ctrl.onChangeRequestBodyType(item)" data-enable-overlap="true"></igz-default-dropdown></div><div class="main-block"><div class="upload-file-section" data-ng-class="{\'uploaded\': $ctrl.uploadingData.uploaded}" data-ng-if="$ctrl.requestBodyType.id === \'file\'"><div class="drop-section" data-ng-class="{\'uploaded\': $ctrl.uploadingData.uploaded}"><div class="drop-message" data-ng-class="{\'uploading\': $ctrl.uploadingData.uploading,\n' +
    '                                                         \'uploaded\': $ctrl.uploadingData.uploaded}"><div data-ng-if="!$ctrl.uploadingData.uploaded && !$ctrl.uploadingData.uploading"><div class="ncl-icon-drop-file"></div>{{ \'functions:DROP_FILE_HERE_OR\' | i18next }}<span class="browse" ngf-select="$ctrl.uploadFile($file)">{{ \'functions:BROWSE\' | i18next }}</span></div><div data-ng-if="$ctrl.uploadingData.uploading"><div class="ncl-icon-drop-file"></div><div class="file-name">{{$ctrl.uploadingData.name}}<span class="size">&nbsp;({{$ctrl.uploadingData.size}})</span></div><div class="progress"><div class="progress-bar" role="uib-progressbar" aria-valuemin="0" aria-valuemax="100" data-ng-style="{\'width\': $ctrl.uploadingData.progress}"></div></div></div><div data-ng-if="$ctrl.uploadingData.uploaded"><div class="file"><span class="ncl-icon-file"></span><div class="name text-ellipsis" data-uib-tooltip="{{$ctrl.uploadingData.name}}" data-tooltip-popup-delay="300" data-tooltip-placement="top">{{$ctrl.uploadingData.name}}</div><span class="size">&nbsp;({{$ctrl.uploadingData.size}})</span><div class="igz-icon-close" data-ng-click="$ctrl.deleteFile()"></div></div></div></div></div></div><div data-ng-if="$ctrl.requestBodyType.id !== \'file\'" class="code-edit-section"><ncl-monaco class="monaco-code-editor" data-function-source-code="$ctrl.selectedEvent.spec.body" data-language="$ctrl.requestSourceCodeLanguage" data-on-change-source-code-callback="$ctrl.onChangeRequestSourceCode(sourceCode)" data-selected-theme="\'vs-light\'" data-show-line-numbers="true" data-mini-monaco="true" data-name="eventRequestBody" data-read-only="false"></ncl-monaco></div></div></div><div class="headers" data-ng-if="$ctrl.selectedRequestTab.id === \'headers\'"><div data-ng-if="$ctrl.headers.length > 0" class="table-headers"><div class="key-header">{{ \'common:KEY\' | i18next }}</div><div class="value-header">{{ \'common:VALUE\' | i18next }}</div></div><div class="igz-scrollable-container scrollable-headers table-body-wrapper" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="header in $ctrl.headers"><ncl-key-value-input class="new-header-input" data-list-class="scrollable-headers" data-row-data="header" data-item-index="$index" data-use-type="false" data-allow-selection="true" data-value-optional="true" data-on-select-item-callback="$ctrl.onSelectHeader" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-header-button" data-ng-click="$ctrl.addNewHeader($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_HEADER\' | i18next }}</div></div></div></div></div><div ui-layout-container size="55%" min-size="100px" class="response-section" data-ng-class="{\'left-bar-pinned\': $ctrl.fixedLeftBar}"><div class="igz-scrollable-container scrollable-response-section" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="response-header"><div class="left-side-elements">{{ \'functions:RESPONSE\' | i18next }}</div><div class="right-side-elements" data-ng-if="$ctrl.testResult.status"><div>{{ \'common:STATUS\' | i18next }}:<div class="text-ellipsis status {{$ctrl.isInvocationSuccess ? \'success\' : \'fail\'}}" data-uib-tooltip="{{$ctrl.testResult.status.statusCode}} {{$ctrl.testResult.status.statusText}}" data-tooltip-placement="top" data-tooltip-popup-delay="300">{{$ctrl.testResult.status.statusCode}} {{$ctrl.testResult.status.statusText}}</div></div><div>{{ \'common:TIME\' | i18next }}:<span class="time">{{$ctrl.invokeTime}}</span></div><div data-ng-if="$ctrl.responseSize">{{ \'common:SIZE\' | i18next }}:<span class="size">{{$ctrl.responseSize.value + $ctrl.responseSize.label}}</span></div></div></div><div class="response-body"><ncl-test-events-navigation-tabs data-ng-if="$ctrl.showResponse" data-active-tab="$ctrl.selectedResponseTab" data-tab-items="$ctrl.responseNavigationTabs" data-on-change-active-tab="$ctrl.onChangeTab(activeTab, \'selectedResponseTab\')"></ncl-test-events-navigation-tabs><div class="body" data-ng-if="$ctrl.selectedResponseTab.id === \'body\'"><div class="no-response" data-ng-if="!$ctrl.showResponse && !$ctrl.testing"><div class="circle"><div class="ncl-icon-test"></div><div class="ncl-icon-hand"></div></div><div class="message">{{ \'functions:EVENT_RESPONSE_MSG\' | i18next }}</div></div><div class="testing" data-ng-if="$ctrl.testing"><span class="message">{{ \'common:LOADING_CAPITALIZE_ELLIPSIS\' | i18next }}</span><div class="loader-wrapper"><div class="loader-fading-circle"><div class="loader-circle1 loader-circle"></div><div class="loader-circle2 loader-circle"></div><div class="loader-circle3 loader-circle"></div><div class="loader-circle4 loader-circle"></div><div class="loader-circle5 loader-circle"></div><div class="loader-circle6 loader-circle"></div><div class="loader-circle7 loader-circle"></div><div class="loader-circle8 loader-circle"></div><div class="loader-circle9 loader-circle"></div><div class="loader-circle10 loader-circle"></div><div class="loader-circle11 loader-circle"></div><div class="loader-circle12 loader-circle"></div></div></div><div class="ncl-secondary-button" data-ng-click="$ctrl.cancelInvocation()">{{ \'common:CANCEL\' | i18next }}</div></div><div class="code-section" data-ng-if="$ctrl.showResponse && !$ctrl.testing"><div class="igz-action-panel"><div class="actions-list"><div class="igz-action-item" data-ng-click="$ctrl.downloadResponseFile()" data-uib-tooltip="{{ \'common:TOOLTIP.DOWNLOAD_TO_FILE\' | i18next }}" data-tooltip-placement="left" data-tooltip-popup-delay="300" data-tooltip-append-to-body="true"><div class="action-icon igz-icon-download"></div></div><igz-copy-to-clipboard data-value="$ctrl.testResult.body"></igz-copy-to-clipboard></div></div><div class="code-edit-section" data-ng-if="$ctrl.responseBodyType === \'code\'"><ncl-monaco class="monaco-code-editor" data-function-source-code="$ctrl.testResult.body" data-language="\'plaintext\'" data-selected-theme="\'vs-light\'" data-show-line-numbers="true" data-mini-monaco="true" data-no-top-padding="true" data-name="eventResponseBody" data-read-only="true"></ncl-monaco></div><div class="image-section" data-ng-if="$ctrl.responseBodyType === \'image\'"><img class="response-body-img" data-ng-src="{{$ctrl.responseImage}}" alt="{{ \'functions:RESPONSE_IMAGE\' | i18next }}"></div><div class="no-content-section" data-ng-if="$ctrl.responseBodyType === \'N/A\'">{{ \'functions:YOU_CAN_DOWNLOAD_RESPONSE_BODY\' | i18next }}</div></div></div><div class="headers" data-ng-if="$ctrl.selectedResponseTab.id === \'headers\'"><div data-ng-repeat="(key, value) in $ctrl.testResult.headers"><div class="text-ellipsis labels" data-uib-tooltip="{{key}}" data-tooltip-placement="left" data-tooltip-popup-delay="300" data-tooltip-append-to-body="true">{{key}}</div><div class="text-ellipsis values" data-uib-tooltip="{{value}}" data-tooltip-placement="left" data-tooltip-popup-delay="300">{{value}}</div></div></div><div class="logs" data-ng-if="$ctrl.selectedResponseTab.id === \'logs\'"><ncl-test-events-logs data-logs="$ctrl.logs"></ncl-test-events-logs></div></div></div></div></div></form></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-code/function-event-pane/test-events-logs/test-events-logs.tpl.html',
    '<div class="ncl-test-events-logs"><div class="functional-buttons" data-ng-if="$ctrl.logs.length > 0"><div class="ncl-icon-expand-all" data-ng-click="$ctrl.expandAllRows(true)" data-uib-tooltip="{{ \'functions:EXPAND_ALL\' | i18next }}" data-tooltip-popup-delay="300" data-tooltip-placement="left" data-tooltip-append-to-body="true"></div><div class="ncl-icon-collapse-all" data-ng-click="$ctrl.expandAllRows(false)" data-uib-tooltip="{{ \'functions:COLLAPSE_ALL\' | i18next }}" data-tooltip-popup-delay="300" data-tooltip-placement="left" data-tooltip-append-to-body="true"></div></div><div data-ng-repeat="log in $ctrl.logs track by $index"><div class="collapsed-row text-ellipsis" data-ng-if="log.ui.collapsed"><span class="igz-icon-right" data-ng-click="$ctrl.collapseRow(log, false)"></span><div class="level-icon {{$ctrl.getLevelIconClass(log)}}"></div><span class="date">{{log.time | date: "EEE, MMM d, yyyy, HH:mm:ss\'GMT\'" : "+0000"}}</span><div class="message text-ellipsis">{{log.message}}</div><div class="ncl-icon-parameters" data-ng-if="$ctrl.hasAdditionalParameters(log)"></div></div><div class="expanded-row" data-ng-if="!log.ui.collapsed"><div class="header"><span class="igz-icon-down" data-ng-click="$ctrl.collapseRow(log, true)"></span><div class="level-icon {{$ctrl.getLevelIconClass(log)}}"></div><span class="date">{{log.time | date: "EEE, MMM d, yyyy, HH:mm:ss\'GMT\'" : "+0000"}}</span><div class="ncl-icon-parameters" data-ng-if="$ctrl.hasAdditionalParameters(log)"></div></div><div class="expanded-body"><div class="message">{{log.message}}</div><div class="error" data-ng-if="log.err">{{log.err}}</div><div class="parameters" data-ng-if="$ctrl.hasAdditionalParameters(log)"><span class="parameters-header">{{ \'common:PARAMETERS\' | i18next }}</span><div data-ng-repeat="(key, value) in $ctrl.getParameters(log)"><div class="text-ellipsis labels">{{key}}:</div><div class="text-ellipsis values">{{value}}</div></div></div></div></div></div><div class="no-logs" data-ng-if="$ctrl.logs.length === 0">{{ \'functions:NO_LOGS_HAVE_BEEN_FOUND\' | i18next }}</div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-code/function-event-pane/test-events-navigation-tabs/test-events-navigation-tabs.tpl.html',
    '<div class="ncl-test-events-navigation-tabs"><div class="test-events-navigation-tab" data-ng-repeat="item in $ctrl.tabItems" data-ng-click="$ctrl.changeActiveTab(item)" data-ng-class="{\'active\': $ctrl.isActiveTab(item)}">{{item.tabName | uppercase}}<span class="badge" data-ng-if="item.badge">{{item.badge}}</span></div><igz-default-dropdown data-ng-if="$ctrl.selectedLogLevel" data-values-array="$ctrl.logLevelValues" data-select-property-only="id" data-selected-item="$ctrl.selectedLogLevel" data-item-select-callback="$ctrl.onChangeLogLevel({selectedLogLevel: item})" data-enable-overlap="true"></igz-default-dropdown></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-annotations/version-configuration-annotations.tpl.html',
    '<div class="ncl-version-configuration-annotations"><div class="title"><span>{{ \'functions:ANNOTATIONS\' | i18next }}</span><igz-more-info data-description="{{$ctrl.tooltip}}" data-trigger="click" data-is-html-enabled="true"></igz-more-info></div><form name="$ctrl.annotationsForm" class="annotations-wrapper"><div data-ng-if="$ctrl.annotations.length > 0" class="table-headers"><div class="key-header">{{ \'common:KEY\' | i18next }}</div><div class="value-header">{{ \'common:VALUE\' | i18next }}</div></div><div class="igz-scrollable-container scrollable-annotations" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="annotation in $ctrl.annotations"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-annotations" data-change-state-broadcast="change-state-deploy-button" data-row-data="annotation" data-use-type="false" data-item-index="$index" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)" data-submit-on-fly="true"></ncl-key-value-input></div></div><div class="create-annotation-button" data-ng-click="$ctrl.addNewAnnotation($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_ANNOTATION\' | i18next }}</div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-basic-settings/version-configuration-basic-settings.tpl.html',
    '<div class="ncl-version-configuration-basic-settings"><div class="title">{{ \'common:BASIC_SETTINGS\' | i18next }}</div><form name="$ctrl.basicSettingsForm" class="basic-settings-wrapper"><div class="row enable-checkbox"><input type="checkbox" class="small" id="enable" data-ng-model="$ctrl.enableFunction" data-ng-change="$ctrl.updateEnableStatus()"><label for="enable" class="checkbox-inline">{{ \'common:ENABLED\' | i18next }}</label></div><div class="row" data-ng-if="$ctrl.isDemoMode()"><div class="timeout-block"><div class="label"><div class="timeout-checkbox"><input type="checkbox" class="small" id="timeout" data-ng-model="$ctrl.enableTimeout"><label for="timeout" class="checkbox-inline">{{ \'functions:TIMEOUT\' | i18next }}</label></div></div><div class="timeout-values"><div class="inputs"><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="min" data-input-value="$ctrl.timeout.min" data-is-focused="false" data-is-disabled="!$ctrl.enableTimeout" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="timeout.min" data-form-object="$ctrl.basicSettingsForm" data-validation-is-required="true" data-validation-pattern="$ctrl.validationPatterns.digits" data-placeholder-text="{{ \'functions:MIN\' | i18next }}..."></igz-validating-input-field><div class="values-label">{{ \'functions:MIN\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="sec" data-input-value="$ctrl.timeout.sec" data-is-focused="false" data-is-disabled="!$ctrl.enableTimeout" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="timeout.sec" data-form-object="$ctrl.basicSettingsForm" data-validation-is-required="true" data-validation-pattern="$ctrl.validationPatterns.digits" data-placeholder-text="{{ \'functions:SEC\' | i18next }}..."></igz-validating-input-field><div class="values-label">{{ \'functions:SEC\' | i18next }}</div></div></div></div></div><div class="row"><div class="description-block"><div class="label">{{ \'common:DESCRIPTION\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="description" data-input-value="$ctrl.version.spec.description" data-is-focused="false" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.description" data-form-object="$ctrl.basicSettingsForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_DESCRIPTION\' | i18next }}"></igz-validating-input-field></div></div><div class="row"><div class="account-block"><div class="label">{{ \'functions:SERVICE_ACCOUNT\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="serviceAccount" data-input-value="$ctrl.version.spec.serviceAccount" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.serviceAccount" data-form-object="$ctrl.basicSettingsForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.MY_SERVICE_ACCOUNT\' | i18next }}"></igz-validating-input-field></div></div><div class="row"><div class="logger-block"><div class="logger-dropdown"><span class="label">{{ \'functions:LOGGER_LEVEL\' | i18next }}</span><igz-default-dropdown data-selected-item="$ctrl.version.spec.loggerSinks[0].level" data-select-property-only="id" data-values-array="$ctrl.logLevelValues" data-item-select-callback="$ctrl.setPriority(item)" data-enable-overlap="true" data-prevent-drop-up="true"></igz-default-dropdown></div><div class="logger-input" data-ng-if="$ctrl.isDemoMode()"><span class="label">{{ \'functions:LOGGER_DESTINATION\' | i18next }}</span><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="arguments" data-input-value="$ctrl.version.spec.loggerSinks[0].sink" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.loggerSinks[0].sink" data-form-object="$ctrl.basicSettingsForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_DESTINATION\' | i18next }}"></igz-validating-input-field></div></div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build.tpl.html',
    '<div class="ncl-version-configuration-build" data-ng-class="{ disabled: $ctrl.disabled }"><div class="configuration-build-title-wrapper"><div class="title pull-left">{{ \'functions:BUILD\' | i18next }}</div><igz-action-menu data-ng-if="$ctrl.isDemoMode() && !$ctrl.disabled" data-actions="$ctrl.actions" data-icon-class="ncl-icon-paperclip" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu><small class="pull-right" data-ng-if="$ctrl.disabled">{{ \'functions:EDITABLE_FOR_EDIT_ONLINE\' | i18next }}</small></div><form name="$ctrl.buildForm" class="build-wrapper"><div class="igz-row"><div class="igz-col-100 build-field"><div class="field-label"><span>{{ \'functions:IMAGE_NAME\' | i18next }}</span><igz-more-info data-description="{{ \'functions:IMAGE_NAME_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field data-field-type="input" data-input-name="imageName" data-input-value="$ctrl.version.spec.build.image" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_IMAGE_NAME\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.image" data-is-disabled="$ctrl.disabled" class="nuclio-validating-input"></igz-validating-input-field></div><div class="igz-col-50 build-field build-base-image-field"><div class="field-label label-with-tooltip align-items-center"><span>{{ \'functions:BASE_IMAGE\' | i18next }}</span><igz-more-info data-description="{{ \'functions:BASE_IMAGE_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field data-field-type="input" data-input-name="baseImage" data-input-value="$ctrl.version.spec.build.baseImage" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_BASE_IMAGE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.baseImage" data-is-disabled="$ctrl.disabled" class="nuclio-validating-input"></igz-validating-input-field></div><div class="igz-col-50 build-field build-onbuild-image-field"><div class="field-label label-with-tooltip align-items-center"><span>{{ \'functions:ONBUILD_IMAGE\' | i18next }}</span><igz-more-info data-description="{{ \'functions:ONBUILD_IMAGE_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field data-field-type="input" data-input-name="onbuildImage" data-input-value="$ctrl.version.spec.build.onbuildImage" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_ONBUILD_IMAGE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.build.onbuildImage" data-is-disabled="$ctrl.disabled" class="nuclio-validating-input"></igz-validating-input-field></div><div class="igz-col-100 build-field"><div class="field-label"><span>{{ \'functions:BUILD_COMMANDS\' | i18next }}</span><igz-more-info data-description="{{ \'functions:BUILD_COMMANDS_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-validating-input-field data-field-type="textarea" data-input-name="commands" data-input-value="$ctrl.build.commands" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_COMMAND_ON_EACH_LINE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="commands" data-is-disabled="$ctrl.disabled" class="nuclio-validating-input build-textarea-input build-commands-input"></igz-validating-input-field></div><div class="igz-col-100 build-field"><div class="field-label label-with-tooltip align-items-center"><span>{{ \'functions:READINESS_TIMEOUT_SECONDS\' | i18next }}</span><igz-more-info data-description="{{ \'functions:READINESS_TIMEOUT_SECONDS_DESCRIPTION\' | i18next }}" data-trigger="click"></igz-more-info></div><igz-number-input data-form-object="$ctrl.buildForm" data-input-name="readinessTimeoutSeconds" data-current-value="$ctrl.version.spec.readinessTimeoutSeconds" data-update-number-input-callback="$ctrl.inputValueCallback(newData, field)" data-update-number-input-field="spec.readinessTimeoutSeconds" data-allow-empty-field="true" data-value-step="1" data-validation-is-required="false" data-min-value="1" data-is-disabled="$ctrl.disabled"></igz-number-input></div><div class="igz-col-100 build-field" data-ng-if="$ctrl.version.spec.runtime === \'java\'"><div class="field-label">{{ \'functions:REPOSITORIES\' | i18next }}</div><igz-validating-input-field data-field-type="textarea" data-input-name="repositories" data-input-value="$ctrl.build.runtimeAttributes.repositories" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_REPOSITORY_ON_EACH_LINE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="runtimeAttributes.repositories" class="nuclio-validating-input build-textarea-input" data-is-disabled="$ctrl.disabled"></igz-validating-input-field></div><div class="igz-col-100 build-field" data-ng-if="$ctrl.version.spec.runtime === \'java\'"><div class="field-label">{{ \'functions:DEPENDENCIES\' | i18next }}</div><igz-validating-input-field data-field-type="textarea" data-input-name="dependencies" data-input-value="$ctrl.build.dependencies" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_DEPENDENCY_ON_EACH_LINE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="dependencies" class="nuclio-validating-input build-textarea-input" data-is-disabled="$ctrl.disabled"></igz-validating-input-field></div><div class="igz-col-100 build-field build-checkboxes"><div class="checkbox-block" data-uib-tooltip="{{ \'functions:TOOLTIP.DISABLE_CACHE\' | i18next }}" data-tooltip-placement="bottom" data-tooltip-append-to-body="true" data-tooltip-popup-delay="500"><input type="checkbox" class="small" id="noCache" data-ng-model="$ctrl.version.spec.build.noCache" data-ng-disabled="$ctrl.disabled"><label for="noCache" class="checkbox-inline">{{ \'functions:DISABLE_CACHE\' | i18next }}</label></div></div><div class="igz-col-100 build-field files-field"><div class="uploading-files"><div class="uploading-proccess-wrapper" data-ng-class="{\'one-file-uploaded\': $ctrl.file.uploaded || $ctrl.script.uploaded}" data-ng-if="$ctrl.getFileConfig().uploading && $ctrl.getFileConfig().name"><div class="file-block uploading text-ellipsis" data-ng-class="{\'uploading-file\': $ctrl.file.uploading}"><span class="{{$ctrl.getFileConfig().icon}}"></span><button class="build-close-button"><span class="ncl-icon-close"></span></button><span class="file-name">{{$ctrl.getFileConfig().name}}</span><div class="progress"><div class="progress-bar" role="uib-progressbar" aria-valuemin="0" aria-valuemax="100" data-ng-style="{\'width\': $ctrl.getFileConfig().progress}"></div></div></div></div><div class="uploaded-wrapper" data-ng-if="$ctrl.file.uploaded|| $ctrl.script.uploaded"><div class="file-block uploaded text-ellipsis" data-ng-if="$ctrl.script.uploaded" data-ng-class="{\'one-file-uploaded\': $ctrl.file.uploaded}"><span class="ncl-icon-script"></span><span class="file-name">{{$ctrl.script.name}}<span class="uploaded-file-directory">(/usr/bin/mybinary)</span></span><button class="build-close-button" data-ng-click="$ctrl.deleteFile(\'script\')"><span class="ncl-icon-close"></span></button></div><div class="file-block uploaded text-ellipsis uploaded-file" data-ng-if="$ctrl.file.uploaded"><span class="ncl-icon-file"></span><span class="file-name">{{$ctrl.file.name}}<span class="uploaded-file-directory">(/usr/bin/mybinary)</span></span><button class="build-close-button" data-ng-click="$ctrl.deleteFile(\'file\')"><span class="ncl-icon-close"></span></button></div></div></div></div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
    '<div class="ncl-version-configuration-environment-variables"><div class="title">{{ \'functions:ENVIRONMENT_VARIABLES\' | i18next }}</div><form name="$ctrl.environmentVariablesForm" class="resources-wrapper"><div class="igz-scrollable-container scrollable-environment-variables" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="variable in $ctrl.variables"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-environment-variables" data-change-state-broadcast="change-state-deploy-button" data-row-data="variable" data-item-index="$index" data-use-type="true" data-use-labels="true" data-all-value-types="$ctrl.isOnlyValueTypeInputs" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)" data-dropdown-overlap="true" data-submit-on-fly="true"></ncl-key-value-input></div></div><div class="create-variable-button" data-ng-click="$ctrl.addNewVariable($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_ENVIRONMENT_VARIABLE\' | i18next }}</div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
    '<div class="ncl-version-configuration-labels"><div class="title"><span>{{ \'functions:LABELS\' | i18next }}</span><igz-more-info data-description="{{$ctrl.tooltip}}" data-trigger="click" data-is-html-enabled="true"></igz-more-info></div><form name="$ctrl.labelsForm" class="labels-wrapper"><div data-ng-if="$ctrl.labels.length > 0" class="table-headers"><div class="key-header">{{ \'common:KEY\' | i18next }}</div><div class="value-header">{{ \'common:VALUE\' | i18next }}</div></div><div class="igz-scrollable-container scrollable-labels" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="label in $ctrl.labels"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-labels" data-change-state-broadcast="change-state-deploy-button" data-row-data="label" data-item-index="$index" data-use-type="false" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)" data-submit-on-fly="true"></ncl-key-value-input></div></div><div class="create-label-button" data-ng-click="$ctrl.addNewLabel($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_LABEL\' | i18next }}</div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-logging/version-configuration-logging.tpl.html',
    '<div class="ncl-version-configuration-logging"><div class="title">{{ \'functions:LOGGING\' | i18next }}</div><div class="row"><form name="$ctrl.loggingForm" class="logging-wrapper"></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-resources/version-configuration-resources.tpl.html',
    '<div class="ncl-version-configuration-resources"><div class="title">{{ \'common:RESOURCES\' | i18next }}</div><form name="$ctrl.resourcesForm" class="resources-wrapper"><div class="row"><div class="igz-row form-row range-inputs-row"><div class="igz-col-10 row-title">{{ \'common:MEMORY\' | i18next }}</div><div class="igz-col-40 input-wrapper"><div class="input-title">{{ \'common:REQUEST\' | i18next }}</div><div class="row-input memory-input memory-number-input"><igz-number-input data-allow-empty-field="true" data-validation-is-required="false" data-form-object="$ctrl.resourcesForm" data-input-name="requestMemory" data-update-number-input-callback="$ctrl.memoryInputCallback(newData, field)" data-update-number-input-field="spec.resources.requests.memory" data-min-value="1" data-current-value="$ctrl.requestsMemoryValue;" data-value-step="1"></igz-number-input></div><div class="row-input memory-input memory-size-dropdown"><igz-default-dropdown data-values-array="$ctrl.dropdownOptions" data-selected-item="$ctrl.selectedRequestUnit" data-item-select-callback="$ctrl.memoryDropdownCallback(item, isItemChanges, field)" data-item-select-field="spec.resources.requests.memory"></igz-default-dropdown></div></div><div class="igz-col-40 input-wrapper"><div class="input-title">{{ \'common:LIMIT\' | i18next }}</div><div class="row-input memory-input memory-number-input"><igz-number-input data-allow-empty-field="true" data-validation-is-required="false" data-form-object="$ctrl.resourcesForm" data-input-name="limitsMemory" data-min-value="1" data-update-number-input-callback="$ctrl.memoryInputCallback(newData, field)" data-update-number-input-field="spec.resources.limits.memory" data-current-value="$ctrl.limitsMemoryValue;" data-value-step="1"></igz-number-input></div><div class="row-input memory-input memory-size-dropdown"><igz-default-dropdown data-values-array="$ctrl.dropdownOptions" data-selected-item="$ctrl.selectedLimitUnit" data-item-select-callback="$ctrl.memoryDropdownCallback(item, isItemChanges, field)" data-item-select-field="spec.resources.limits.memory"></igz-default-dropdown></div></div></div><div class="igz-row form-row range-inputs-row"><div class="igz-col-10 row-title">{{ \'common:CPU\' | i18next }}</div><div class="igz-col-40 input-wrapper"><div class="input-title">{{ \'common:REQUEST\' | i18next }}</div><div class="row-input cpu-number-input"><igz-number-input data-allow-empty-field="true" data-validation-is-required="false" data-form-object="$ctrl.resourcesForm" data-input-name="requestCpu" data-placeholder="{{ $ctrl.selectedCpuRequestItem.placeholder }}" data-update-number-input-callback="$ctrl.inputValueCallback(newData, field)" data-update-number-input-field="resources.requests.cpu" data-min-value="$ctrl.selectedCpuRequestItem.minValue" data-precision="{{ $ctrl.selectedCpuRequestItem.precision }}" data-value-step="{{ $ctrl.selectedCpuRequestItem.step }}" data-current-value="$ctrl.requestsCpuValue"></igz-number-input></div><div class="row-input cpu-dropdown"><igz-default-dropdown data-values-array="$ctrl.cpuDropdownOptions" data-selected-item="$ctrl.selectedCpuRequestItem" data-item-select-callback="$ctrl.cpuDropdownCallback(item, isItemChanged, field)" data-item-select-field="selectedCpuRequestItem"></igz-default-dropdown></div></div><div class="igz-col-40 input-wrapper"><div class="input-title">{{ \'common:LIMIT\' | i18next }}</div><div class="row-input cpu-number-input"><igz-number-input data-allow-empty-field="true" data-validation-is-required="false" data-form-object="$ctrl.resourcesForm" data-input-name="limitsCpu" data-placeholder="{{ $ctrl.selectedCpuLimitItem.placeholder }}" data-update-number-input-callback="$ctrl.inputValueCallback(newData, field)" data-update-number-input-field="resources.limits.cpu" data-min-value="$ctrl.selectedCpuLimitItem.minValue" data-precision="{{ $ctrl.selectedCpuLimitItem.precision }}" data-value-step="{{ $ctrl.selectedCpuLimitItem.step }}" data-current-value="$ctrl.limitsCpuValue"></igz-number-input></div><div class="row-input cpu-dropdown"><igz-default-dropdown data-values-array="$ctrl.cpuDropdownOptions" data-selected-item="$ctrl.selectedCpuLimitItem" data-item-select-callback="$ctrl.cpuDropdownCallback(item, isItemChanged, field)" data-item-select-field="selectedCpuLimitItem"></igz-default-dropdown></div></div></div><div class="igz-row form-row range-inputs-row"><div class="igz-col-10 row-title">{{ \'common:GPU\' | i18next }}</div><div class="igz-col-40 input-wrapper"></div><div class="igz-col-40 input-wrapper" data-uib-tooltip="{{ \'common:TOOLTIP.PER_REPLICA\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="500"><div class="input-title">{{ \'common:LIMIT\' | i18next }}</div><div class="row-input gpu-number-input"><igz-number-input data-allow-empty-field="true" data-validation-is-required="false" data-form-object="$ctrl.resourcesForm" data-input-name="limitsGpu" data-placeholder="1 - 4" data-update-number-input-callback="$ctrl.inputGpuValueCallback(newData, field)" data-update-number-input-field="limits" data-min-value="1" data-max-value="4" data-value-step="1" data-current-value="$ctrl.limitsGpuValue"></igz-number-input></div></div></div><div class="igz-row form-row range-inputs-row"><div class="igz-col-10 row-title">{{ \'common:REPLICAS\' | i18next }}</div><div class="igz-col-40 input-wrapper"><div class="input-title">{{ \'functions:MIN\' | i18next }}</div><div class="row-input replicas-number-input"><igz-number-input data-form-object="$ctrl.resourcesForm" data-input-name="minReplicas" data-current-value="$ctrl.minReplicas" data-update-number-input-callback="$ctrl.numberInputCallback(newData, field)" data-update-number-input-field="minReplicas" data-allow-empty-field="true" data-placeholder="" data-decimal-number="0" data-value-step="1" data-validation-is-required="false" data-min-value="0" data-max-value="$ctrl.maxReplicas || Infinity"></igz-number-input></div></div><div class="igz-col-40 input-wrapper"><div class="input-title">{{ \'functions:MAX\' | i18next }}</div><div class="row-input replicas-number-input"><igz-number-input data-form-object="$ctrl.resourcesForm" data-input-name="maxReplicas" data-current-value="$ctrl.maxReplicas" data-update-number-input-callback="$ctrl.numberInputCallback(newData, field)" data-update-number-input-field="maxReplicas" data-allow-empty-field="true" data-placeholder="" data-decimal-number="0" data-value-step="1" data-validation-is-required="false" data-min-value="$ctrl.minReplicas || 1"></igz-number-input></div></div></div><div class="igz-row form-row range-inputs-row slider-block"><div class="igz-col-10 row-title target-cpu-title">{{ \'common:TARGET_CPU\' | i18next }}</div><input type="checkbox" class="small" id="target-cpu-toggle" data-ng-true-value="false" data-ng-false-value="true" data-ng-model="$ctrl.targetCpuSliderConfig.options.disabled" data-ng-change="$ctrl.toggleTargetCpu()"><label for="target-cpu-toggle" class="checkbox-inline" data-uib-tooltip="{{ ($ctrl.targetCpuSliderConfig.options.disabled ? \'functions:CLICK_TO_ENABLE\' : \'functions:CLICK_TO_DISABLE\') | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="top" data-tooltip-popup-delay="500">&nbsp;</label><div class="slider-row"><igz-slider-input-block data-slider-config="$ctrl.targetCpuSliderConfig" data-measure-units="null" data-value-unit="$ctrl.targetCpuValueUnit" data-slider-block-updating-broadcast="" data-on-change-callback="$ctrl.sliderInputCallback" data-update-slider-input="spec.targetCPU" data-uib-tooltip="{{ \'functions:TOOLTIP.TARGET_CPU\' | i18next }}" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="500" data-allow-full-range="true"></igz-slider-input-block></div></div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
    '<div class="ncl-version-configuration-runtime-attributes"><div class="title">{{ \'functions:RUNTIME_ATTRIBUTES\' | i18next }}</div><form name="$ctrl.runtimeAttributesForm" class="runtime-attributes-wrapper"><div class="row" data-ng-class="{\'info-row\': $ctrl.version.spec.runtime !== \'shell\'}" data-ng-if="$ctrl.version.spec.runtime !== \'java\'"><div class="runtime-title"><span class="label">{{ \'functions:RUNTIME\' | i18next }}</span><div class="runtime">{{$ctrl.version.spec.runtime}}</div></div><div class="arguments-input" data-ng-if="$ctrl.version.spec.runtime === \'shell\'"><span class="label">{{ \'common:ARGUMENTS\' | i18next }}</span><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-input-name="arguments" data-input-value="$ctrl.runtimeAttributes.arguments" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="arguments" data-form-object="$ctrl.runtimeAttributesForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_ARGUMENTS\' | i18next }}"></igz-validating-input-field></div></div><div class="row igz-col-100 info-row" data-ng-if="$ctrl.version.spec.runtime === \'java\'"><div class="row igz-col-100 info-row"><span class="field-label">{{ \'functions:JVM_OPTIONS\' | i18next }}</span><igz-validating-input-field data-field-type="textarea" data-input-name="jvmOptions" data-input-value="$ctrl.runtimeAttributes.jvmOptions" data-is-focused="false" data-form-object="$ctrl.runtimeAttributesForm" data-placeholder-text="{{ \'functions:PLACEHOLDER.ENTER_OPTION_ON_EACH_LINE\' | i18next }}" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="jvmOptions" class="nuclio-validating-input build-command-field java-attribute"></igz-validating-input-field></div></div><div class="row info-row" data-ng-if="$ctrl.version.spec.runtime === \'shell\'"><span class="label">{{ \'functions:RESPONSE_HEADERS\' | i18next }}</span><div data-ng-if="$ctrl.attributes.length > 0" class="table-headers"><div class="key-header">{{ \'common:KEY\' | i18next }}</div><div class="value-header">{{ \'common:VALUE\' | i18next }}</div></div><div class="igz-scrollable-container" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="attribute in $ctrl.attributes"><ncl-key-value-input class="new-label-input" data-row-data="attribute" data-change-state-broadcast="change-state-deploy-button" data-use-type="false" data-item-index="$index" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-label-button" data-ng-click="$ctrl.addNewAttribute($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_RUNTIME_ATTRIBUTE\' | i18next }}</div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-volumes/version-configuration-volumes.tpl.html',
    '<div class="ncl-version-configuration-volumes"><div class="title"><span>{{ \'functions:VOLUMES\' | i18next }}</span><igz-more-info data-description="{{ \'functions:TOOLTIP.VOLUMES\' | i18next }}" data-trigger="click"></igz-more-info></div><form name="$ctrl.volumesForm" class="volumes-wrapper"><div class="ncl-version-volume"><div class="common-table"><div data-ng-if="$ctrl.volumes.length > 0" class="common-table-header item-header"><div class="common-table-cell item-name">{{ \'common:NAME\' | i18next }}</div><div class="common-table-cell item-class">{{ \'common:TYPE\' | i18next }}</div><div class="igz-col-70 common-table-cell">{{ \'functions:MOUNT_PATH_PARAMS\' | i18next }}</div></div><div class="common-table-body"><div class="igz-scrollable-container scrollable-volumes" data-ng-scrollbars data-igz-ng-scrollbars-config="{{$ctrl.igzScrollConfig}}" data-ng-scrollbars-config="$ctrl.scrollConfig"><ncl-collapsing-row data-ng-repeat="volume in $ctrl.volumes" data-item="volume" data-type="volume" data-list-class="scrollable-volumes" data-action-handler-callback="$ctrl.handleAction(actionType, selectedItem)"><ncl-edit-item class="common-table-cells-container edit-volume-row" data-item="volume" data-type="volume" data-on-submit-callback="$ctrl.editVolumeCallback(item)"></ncl-edit-item></ncl-collapsing-row></div></div></div></div><div class="create-volume-button" data-ng-click="$ctrl.createVolume($event)"><span class="igz-icon-add-round"></span>{{ \'functions:CREATE_NEW_VOLUME\' | i18next }}</div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build-dialog/version-configuration-build-dialog.tpl.html',
    '<div class="close-button ncl-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>{{ \'functions:ATTACH_FILE\' | i18next }}</span></div><div class="main-content"><form name="attachFileForm" novalidate><div class="field-group"><div class="field-label">{{ \'functions:REMOTE_PATH\' | i18next }}</div><igz-validating-input-field class="nuclio-validating-input" data-field-type="input" data-is-focused="true" data-placeholder-text="{{ \'common:PLACEHOLDER.ENTER_PATH\' | i18next }}"></igz-validating-input-field></div></form></div><div class="buttons"><button class="ncl-secondary-button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">{{ \'common:CANCEL\' | i18next }}</button><button class="ncl-primary-button" tabindex="0" ngf-select="$ctrl.uploadFile($file)">{{ \'common:BROWSE\' | i18next }}</button></div>');
}]);
})();
