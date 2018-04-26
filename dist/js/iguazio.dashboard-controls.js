'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls', ['iguazio.dashboard-controls.templates']);
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
                pattern: '=igzInputOnlyValidCharacters'
            },
            link: link
        };

        function link(scope, element, attr, ngModelCtrl) {
            var REGEXP = scope.pattern;
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

                ngModelCtrl.$parsers.unshift(checkForDigits);
            }

            /**
             * Checks whether entered value is valid
             * @param {string} viewValue - entered view value
             * @returns {string} the last valid entered value
             */
            function checkForDigits(viewValue) {
                if (attr.onlyValidCharacters) {
                    if (REGEXP.test(viewValue)) {

                        // Saves as valid view value if it's a not empty string
                        lastValidViewValue = viewValue === '' ? '' : Number(viewValue);
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
            activate();

            //
            // Private methods
            //

            /**
             * Constructor
             */
            function activate() {
                scope.$on('resize-cells', resizeCells);
                scope.$on('autofit-col', autoFitColumn);

                $timeout(function () {
                    $rootScope.$broadcast('reload-columns');
                });
            }

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
                    nextCell.style.width = data.nextColumnWidth;
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
            template: '<div class="resize-block" data-ng-mousedown="resizeTable.onMouseDown($event)" data-ng-click="resizeTable.onClick($event)" data-ng-dblclick="resizeTable.onDoubleClick($event)"></div>',
            controller: IgzResizeTableController,
            controllerAs: 'resizeTable',
            bindToController: true
        };

        function IgzResizeTableController($element, $scope) {
            var vm = this;

            vm.minWidth = 100;
            vm.startPosition = 0;

            vm.onMouseDown = onMouseDown;
            vm.onClick = onClick;
            vm.onDoubleClick = onDoubleClick;

            activate();

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
                if (vm.columnHeadMinWidth < vm.columnHeadWidth) {
                    var colDifference = vm.columnHeadMinWidth - vm.columnHeadWidth;
                    resizeColumn(colDifference);
                }

                // set width of the column to fit the content
                $rootScope.$broadcast('autofit-col', { colClass: vm.colClass, callbackFunction: resizeColumn });
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
                vm.startPosition = event.clientX;

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
            function activate() {

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
                var colDifference = event.clientX - vm.startPosition;
                vm.startPosition = event.clientX;
                resetColumnsWidths();
                resizeColumn(colDifference);
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
                if (!lodash.isNil(vm.nextBlock)) {
                    $timeout(function () {
                        resetColumnsWidths();

                        $rootScope.$broadcast('resize-cells', { colClass: vm.colClass, columnWidth: vm.columnHeadWidth + 'px', nextColumnWidth: vm.nextBlockWidth + 'px' });
                    });
                }
            }

            /**
             * Initialises columns and their min width
             */
            function initColumnsWidths() {

                // get block which will be resized
                vm.columnHead = $element[0].parentElement;
                vm.columnHeadMinWidth = vm.minWidth;
                if (vm.columnHead.offsetWidth > 0) {
                    vm.columnHeadMinWidth = lodash.min([vm.columnHead.offsetWidth, vm.minWidth]);
                }

                // get parent container of the header
                vm.parentBlock = vm.columnHead.parentElement;

                // get block which is next to resizing block
                vm.nextBlock = vm.columnHead.nextElementSibling;
                vm.nextBlockMinWidth = vm.minWidth;
                if (!lodash.isNil(vm.nextBlock) && vm.nextBlock.offsetWidth > 0) {
                    vm.nextBlockMinWidth = lodash.min([vm.nextBlock.offsetWidth, vm.minWidth]);
                }
                resetColumnsWidths();
            }

            /**
             * Resets columns widths
             */
            function resetColumnsWidths() {
                vm.columnHeadWidth = vm.columnHead.offsetWidth;
                vm.parentBlockWidth = vm.parentBlock.offsetWidth;
                if (!lodash.isNil(vm.nextBlock)) {
                    vm.nextBlockWidth = vm.nextBlock.offsetWidth;
                }
            }

            /**
             * Resize cells in the table rows according to column width
             * @param {Object} data - information about column name and difference
             */
            function resizeColumn(colDifference) {
                if (!lodash.isNil(vm.nextBlock)) {

                    // calculate new width for the block which need to be resized
                    var maxColumnHeadDifference = vm.columnHeadWidth - vm.columnHeadMinWidth;

                    // calculate new width for the  block which is next to resizing block
                    var maxNextBlockDifference = vm.nextBlockWidth - vm.nextBlockMinWidth;

                    // calculate maximum resizing value of columns
                    var newDifference = 0;
                    if (colDifference > 0 && maxNextBlockDifference > 0) {
                        newDifference = lodash.min([colDifference, maxNextBlockDifference]);
                    } else if (colDifference < 0 && maxColumnHeadDifference > 0) {
                        newDifference = lodash.max([colDifference, -maxColumnHeadDifference]);
                    }

                    if (newDifference !== 0) {
                        vm.columnHeadWidth = vm.columnHeadWidth + newDifference;
                        vm.nextBlockWidth = vm.nextBlockWidth - newDifference;

                        setElementWidth(vm.columnHead, vm.columnHeadWidth);
                        setElementWidth(vm.nextBlock, vm.nextBlockWidth);

                        $rootScope.$broadcast('resize-cells', {
                            colClass: vm.colClass,
                            columnWidth: vm.columnHeadWidth + 'px',
                            nextColumnWidth: vm.nextBlockWidth + 'px'
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
                element.style.width = widthInPixels / vm.parentBlockWidth * 100 + '%';
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
            isColumnSorted: isColumnSorted
        };

        //
        // Public methods
        //

        /**
         * Checks whether the passed column name equals the last sorted column name
         * @param {string} columnName
         * @param {string} lastSortedColumnName
         * @param {boolean} isReversed
         * @return {{sorted: boolean, reversed: boolean}} - an object with css class names suitable for `ng-class`
         */
        function isColumnSorted(columnName, lastSortedColumnName, isReversed) {
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

    angular.module('iguazio.dashboard-controls').factory('ConvertorService', ConvertorService);

    function ConvertorService() {
        return {
            getConvertedBytes: getConvertedBytes
        };

        /**
         * Method converts bytes into appropriate value
         * @param {number} bytes - number of bytes
         * @returns {Object} object witch contains converted value, label for converted value and pow number
         */
        function getConvertedBytes(bytes) {
            if (bytes === 0 || !angular.isNumber(bytes) || !isFinite(bytes)) {
                return { value: 1025, label: 'GB/s', pow: 3 };
            }

            var units = ['bytes', 'KB/s', 'MB/s', 'GB/s'];
            var number = Math.floor(Math.log(bytes) / Math.log(1024));

            // max available value is 1024 GB/s
            if (number > 3) {
                number = 3;
                bytes = Math.pow(1024, Math.floor(number + 1));
            }

            return { value: Math.round(bytes / Math.pow(1024, Math.floor(number))), label: units[number], pow: number };
        }
    }
})();
'use strict';

(function () {
    'use strict';

    DialogsService.$inject = ['$q', 'lodash', 'ngDialog', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').factory('DialogsService', DialogsService);

    function DialogsService($q, lodash, ngDialog, FormValidationService) {
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
            buttonText = lodash.defaultTo(buttonText, 'OK');

            if (angular.isArray(alertText)) {
                alertText = alertText.length === 1 ? lodash.first(alertText) : '<ul class="error-list"><li class="error-list-item">' + alertText.join('</li><li class="error-list-item">') + '</li></ul>';
            }

            return ngDialog.open({
                template: '<div class="notification-text title igz-scrollable-container" data-ng-scrollbars>' + alertText + '</div>' + '<div class="buttons">' + '<div class="igz-button-primary" data-ng-click="closeThisDialog() || $event.stopPropagation()">' + buttonText + '</div>' + '</div>',
                plain: true
            }).closePromise;
        }

        /**
         * Show confirmation dialog
         *
         * @param {string|Object} confirmText that will be shown in pop-up
         * @param {string} confirmButton Text displayed on Confirm button
         * @param {string} [cancelButton=Cancel] Text displayed on Cancel button
         * @param {string} type - type of popup dialog
         * @returns {Object}
         */
        function confirm(confirmText, confirmButton, cancelButton, type) {
            var confirmMessage = !lodash.isNil(type) && type === 'nuclio_alert' && lodash.isPlainObject(confirmText) ? confirmText.message : confirmText;

            if (!cancelButton) {
                cancelButton = 'Cancel';
            }

            var template = '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="nuclio-alert-icon"></div><div class="notification-text title">' + confirmMessage + '</div>' + (!lodash.isNil(type) && type === 'nuclio_alert' && !lodash.isNil(confirmText.description) ? '<div class="notification-text description">' + confirmText.description + '</div>' : '') + '<div class="buttons">' + '<div class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(0)" data-ng-keydown="$event.keyCode === 13 && closeThisDialog(0)">' + cancelButton + '</div>' + '<div class="' + (!lodash.isNil(type) && (type === 'critical_alert' || type === 'nuclio_alert') ? 'igz-button-remove' : 'igz-button-primary') + '" tabindex="0" data-ng-click="confirm(1)" data-ng-keydown="$event.keyCode === 13 && confirm(1)">' + confirmButton + '</div>' + '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                className: !lodash.isNil(type) && type === 'nuclio_alert' ? 'ngdialog-theme-nuclio delete-entity-dialog-wrapper' : 'ngdialog-theme-iguazio'
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
            var template = '<div class="notification-text title">' + confirmText + '</div>' + '<div class="buttons">' + '<div class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(-1)" data-ng-keydown="$event.keyCode === 13 && closeThisDialog(-1)">' + cancelButton + '</div>';
            lodash.each(actionButtons, function (button, index) {
                template += '<div class="igz-button-primary" tabindex="0" data-ng-click="confirm(' + index + ')" data-ng-keydown="$event.keyCode === 13 && confirm(' + index + ')">' + button + '</div>';
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
            label = angular.isString(label) ? label : 'Image preview:';

            return ngDialog.open({
                template: '<div class="title text-ellipsis"' + 'data-tooltip="' + label + '"' + 'data-tooltip-popup-delay="400"' + 'data-tooltip-append-to-body="true"' + 'data-tooltip-placement="bottom-left">' + label + '</div>' + '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="image-preview-container">' + '<img class="image-preview" src="' + src + '" alt="You have no permissions to read the file"/></div>',
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
                template: '<div class="header"></div><div class="notification-text">' + alertText + '</div>' + '<div class="buttons">' + '<div class="refresh-button" data-ng-click="closeThisDialog()"><span class="igz-icon-refresh"></span>' + buttonText + '</div>' + '</div>',
                plain: true,
                className: 'ngdialog-theme-iguazio oops-dialog'
            }).closePromise;
        }

        /**
         * Show confirmation dialog with input field
         *
         * @param {string} promptText that will be shown in pop-up
         * @param {string} confirmButton Text displayed on Confirm button
         * @param {string} [cancelButton='Cancel'] Text displayed on Cancel button
         * @param {string} [defaultValue=''] Value that should be shown in text input after prompt is opened
         * @param {string} [placeholder=''] Text input placeholder
         * @param {Object} [validation] Validation pattern
         * @param {boolean} required Should input be required or not
         * @returns {Object}
         */
        function prompt(promptText, confirmButton, cancelButton, defaultValue, placeholder, validation, required) {
            cancelButton = cancelButton || 'Cancel';
            placeholder = placeholder || '';
            defaultValue = defaultValue || '';

            var data = {
                value: defaultValue,
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
                template: '<div data-ng-form="ngDialogData.igzDialogPromptForm">' + '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="notification-text title">' + promptText + '</div>' + '<div class="main-content">' + '<div class="field-group">' + '<div class="field-input">' + '<igz-validating-input-field data-field-type="input" ' + 'data-input-name="promptName" ' + 'data-input-value="ngDialogData.value" ' + 'data-form-object="ngDialogData.igzDialogPromptForm" ' + 'data-is-focused="true" ' + (angular.isDefined(validation) ? 'data-validation-pattern="ngDialogData.validation" ' : '') + (placeholder !== '' ? 'data-placeholder-text="' + placeholder + '" ' : '') + (required ? 'data-validation-is-required="true" ' : '') + 'data-update-data-callback="ngDialogData.inputValueCallback(newData)"' + '>' + '</igz-validating-input-field>' + (angular.isDefined(validation) ? '<div class="error-text" data-ng-show="ngDialogData.isShowFieldInvalidState(ngDialogData.igzDialogPromptForm, ngDialogData.inputName)">' + 'The input is Invalid, please try again.' + '</div>' : '') + '</div>' + '</div>' + '</div>' + '</div>' + '<div class="buttons">' + '<div class="igz-button-just-text" data-ng-click="closeThisDialog()">' + cancelButton + '</div>' + '<div class="igz-button-primary" data-ng-click="ngDialogData.checkInput() && closeThisDialog(ngDialogData.value)">' + confirmButton + '</div>' + '</div>',
                plain: true,
                data: data
            }).closePromise.then(function (dialog) {
                // if Cancel is clicked, reject the promise
                return angular.isDefined(dialog.value) ? dialog.value : $q.reject('Cancelled');
            });
        }

        /**
         * Shows text
         *
         * @param {string} content that will be shown in pop-up
         * @param {Object} [node] actual node to be shown
         * @param {function} submitData function for submitting data
         * @returns {Promise}
         */
        function text(content, node, submitData) {
            var data = {
                closeButtonText: 'Close',
                submitButtonText: 'Save',
                submitData: submitData,
                label: angular.isString(node.label) ? node.label : 'Text preview:',
                node: node,
                content: content
            };

            return ngDialog.open({
                template: '<igz-text-edit data-label="{{ngDialogData.label}}" data-content="{{ngDialogData.content}}"' + 'data-submit-button-text="{{ngDialogData.submitButtonText}}" data-submit-data="ngDialogData.submitData(newContent)"' + 'data-close-button-text="{{ngDialogData.closeButtonText}}" data-close-dialog="closeThisDialog()" data-node="ngDialogData.node">' + '</igz-text-edit>',
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
         * @param {boolean} validateOnSubmit - if this parameter was passed, that means next -
         * validate field only if form was submitted. Otherwise validates field all the time
         * @returns {boolean}
         */
        function isFieldValid(form, elementName, validateOnSubmit) {
            var formSubmitted = lodash.get(form, '$submitted', false);
            var elementValid = lodash.get(form, elementName + '.$valid', true);

            return validateOnSubmit && !formSubmitted || elementValid;
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

            scrollbarContainer.css('height', currentElement.find(targetElement).offset().top + currentElement.find(targetElement).height() + 'px');
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

    angular.module('iguazio.dashboard-controls').factory('PriorityDropdownService', PriorityDropdownService);

    function PriorityDropdownService() {
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
            return [{
                name: 'Real-time',
                type: 'realtime',
                icon: {
                    name: 'igz-icon-priority-realtime'
                }
            }, {
                name: 'High',
                type: 'high',
                icon: {
                    name: 'igz-icon-priority-high'
                }
            }, {
                name: 'Standard',
                type: 'standard',
                icon: {
                    name: 'igz-icon-priority-standard'
                }
            }, {
                name: 'Low',
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
            return type === 'realtime' ? 'Real-time' : type === 'high' ? 'High' : type === 'standard' ? 'Standard' : type === 'low' ? 'Low' : '';
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').factory('SeverityDropdownService', SeverityDropdownService);

    function SeverityDropdownService() {
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
            return [{
                name: 'Error',
                type: 'error',
                icon: {
                    name: 'igz-icon-warning severity-icon critical'
                }
            }, {
                name: 'Debug',
                type: 'debug',
                icon: {
                    name: 'igz-icon-warning severity-icon major'
                }
            }, {
                name: 'Warning',
                type: 'warning',
                icon: {
                    name: 'igz-icon-warning severity-icon warning'
                }
            }, {
                name: 'Info',
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

    ValidatingPatternsService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('ValidatingPatternsService', ValidatingPatternsService);

    function ValidatingPatternsService(lodash) {
        return {
            boolean: /^(0|1)$/,
            container: /^(?!.*--)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]$|^[A-Za-z]$/,
            email: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            float: /^\d{1,9}(\.\d{1,2})?$/,
            fullName: /^[a-zA-Z][a-zA-Z- ]*$/,
            geohash: /^[a-z0-9]*$/,
            hostName_IpAddress: /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)|(^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$)/,
            id: /^[a-zA-Z0-9\-]*$/,
            ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            mask: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/,
            name: /^[a-zA-Z0-9_]*$/,
            negativeFloat: /^[-]?\d{1,9}(\.\d{1,2})?$/,
            negativeInteger: /^[-]?(0|[1-9]\d*)$|^$/,
            noSpacesNoSpecChars: /^[A-Za-z0-9_-]*$/,
            networkName: /^[a-zA-Z0-9\.\-\()\\\/:\s]*$/,
            path: /^(\/[\w-]+)+(.[a-zA-Z]+?)$/,
            phone: /^\+?\d[\d\-]{4,17}$/,
            storage: /^[a-zA-Z0-9]+?\:\/\/[a-zA-Z0-9\_\-\.]+?\:[a-zA-Z0-9\_\-\./]+?\@[a-zA-Z0-9\_\-\.]+?$/,
            timestamp: /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?((?:[+-](?:[0-1]\d|2[0-3]):[0-5]\d)|Z)?$/,
            url: /^[a-zA-Z0-9]+?\:\/\/[a-zA-Z0-9\_\-\.]+?\:[a-zA-Z0-9\_\-\.]+?\@[a-zA-Z0-9\_\-\.]+?$/,
            username: /^[a-zA-Z][-_a-zA-Z0-9]*$/,
            password: /^.{6,128}$/,
            protocolIpPortAddress: /^[a-z]{2,6}\:\/\/(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))(\:\d{1,5})?$/,
            digits: /^\+?(0|[1-9]\d*)$|^$/,
            tenantName: /^[a-zA-Z][a-zA-Z0-9_]*$/,
            functionName: /^[a-z0-9][a-z0-9.-]{0,252}$/,

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
                    lastName: 30
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

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.allItemsChecked = false;
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

    IgzActionItem.$inject = ['$rootScope', '$scope', '$element', '$document', 'lodash', 'DialogsService'];
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

    function IgzActionItem($rootScope, $scope, $element, $document, lodash, DialogsService) {
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
            lodash.defaults(ctrl.action, {
                visible: true
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (angular.isDefined(ctrl.action.template)) {
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

    IgzActionMenuController.$inject = ['$scope', '$element', '$document', '$rootScope', '$timeout', 'lodash', 'ConfigService', 'PreventDropdownCutOffService'];
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

    function IgzActionMenuController($scope, $element, $document, $rootScope, $timeout, lodash, ConfigService, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.isMenuShown = false;
        ctrl.preventDropdownCutOff = null;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;

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
            ctrl.actions = lodash.filter(ctrl.actions, function (action) {
                return !lodash.has(action, 'visible') || action.visible;
            });
            ctrl.shortcuts = lodash.filter(ctrl.shortcuts, function (shortcut) {
                return !lodash.has(shortcut, 'visible') || shortcut.visible;
            });

            ctrl.actions.forEach(function (action) {

                if (!angular.isFunction(action.handler)) {
                    action.handler = defaultAction;

                    if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                        action.confirm = {
                            message: 'Are you sure you want to delete selected item?',
                            yesLabel: 'Yes, Delete',
                            noLabel: 'Cancel',
                            type: 'critical_alert'
                        };
                    }
                }
            });

            ctrl.iconClass = lodash.defaultTo(ctrl.icon, 'igz-icon-context-menu');

            $scope.$on('close-all-action-menus', closeActionMenu);
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

    IgzActionPanel.$inject = ['$scope', '$rootScope', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('igzActionPanel', {
        bindings: {
            actions: '<',
            onItemsCheckedCount: '&?'
        },
        templateUrl: 'igz_controls/components/action-panel/action-panel.tpl.html',
        controller: IgzActionPanel,
        transclude: true
    });

    function IgzActionPanel($scope, $rootScope, lodash) {
        var ctrl = this;

        var checkedItemsCount = 0;
        var mainActionsCount = 5;

        ctrl.mainActions = [];
        ctrl.remainActions = [];

        ctrl.$onInit = onInit;
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

            ctrl.actions = lodash.filter(ctrl.actions, function (action) {
                return !lodash.has(action, 'visible') || action.visible;
            });

            angular.forEach(ctrl.actions, function (action) {
                if (!angular.isFunction(action.handler)) {
                    action.handler = defaultAction;

                    if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                        action.confirm = {
                            message: 'Are you sure you want to delete selected items?',
                            yesLabel: 'Yes, Delete',
                            noLabel: 'Cancel',
                            type: 'critical_alert'
                        };
                    }
                }
            });
            ctrl.mainActions = lodash.slice(ctrl.actions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(ctrl.actions, mainActionsCount, ctrl.actions.length);
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

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    IgzDefaultDropdownController.$inject = ['$scope', '$element', '$document', '$timeout', '$transclude', '$window', 'lodash', 'EventHelperService', 'FormValidationService', 'PreventDropdownCutOffService', 'PriorityDropdownService', 'SeverityDropdownService'];
    angular.module('iguazio.dashboard-controls').component('igzDefaultDropdown', {
        bindings: {
            bottomButtonCallback: '<?',
            enableTyping: '<?',
            formObject: '<?',
            isDisabled: '<?',
            isCapitalized: '@?',
            isPagination: '<?',
            isRequired: '<?',
            matchPattern: '<',
            preventDropUp: '<?',
            selectedItem: '<',
            valuesArray: '<',
            itemSelectCallback: '&?',
            onOpenDropdown: '<?',
            onCloseDropdown: '&?',
            bottomButtonText: '@?',
            dropdownType: '@?',
            itemSelectField: '@?',
            inputName: '@?',
            nameKey: '@?',
            placeholder: '@?',
            readOnly: '<?',
            selectPropertyOnly: '@?'
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

            // checks if transclude template was passed
            $transclude(function (transclude) {
                ctrl.isTranscludePassed = transclude.length > 0;
            });
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
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
            $document.on('click', unselectDropdown);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', unselectDropdown);
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
                    ctrl.selectItem(item);
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

        /**
         * Sets current item as selected
         * @param {Object} item - current item
         */
        function selectItem(item) {
            var previousItem = angular.copy(ctrl.selectedItem);
            if (angular.isDefined(ctrl.selectPropertyOnly)) {
                ctrl.selectedItem = lodash.get(item, ctrl.selectPropertyOnly);
                ctrl.selectedItemDescription = item.description;
            } else {
                ctrl.selectedItem = item;
            }
            ctrl.typedValue = ctrl.getName(item);

            if (angular.isFunction(ctrl.itemSelectCallback)) {
                $timeout(function () {
                    ctrl.itemSelectCallback({
                        item: item,
                        isItemChanged: previousItem !== ctrl.selectedItem,
                        field: angular.isDefined(ctrl.itemSelectField) ? ctrl.itemSelectField : null
                    });
                });
            }

            ctrl.isDropdownContainerShown = false;
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
                });

                PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
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

    IgzNumberInputController.$inject = ['$timeout', '$element', 'lodash', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzNumberInput', {
        bindings: {
            currentValue: '<',
            currentValueUnit: '<',
            formObject: '<',
            onChange: '<?',
            isDisabled: '<?',
            validationValue: '<',
            validationValueUnit: '<',
            allowEmptyField: '<?',
            disableZeroValue: '<?',
            updateNumberInputCallback: '&?',
            defaultValue: '@',
            inputName: '@',
            isFocused: '@',
            maxValue: '<',
            minValue: '<',
            placeholder: '@',
            precision: '@decimalNumber',
            prefixUnit: '@',
            suffixUnit: '@',
            valueStep: '@',
            updateNumberInputField: '@?'
        },
        templateUrl: 'igz_controls/components/number-input/number-input.tpl.html',
        controller: IgzNumberInputController
    });

    function IgzNumberInputController($timeout, $element, lodash, FormValidationService) {
        var ctrl = this;

        ctrl.numberInputValid = true;
        ctrl.numberInputChanged = false;
        ctrl.precision = Number(ctrl.precision) || 0;
        ctrl.placeholder = ctrl.placeholder || '';

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.checkInvalidation = checkInvalidation;
        ctrl.decreaseValue = decreaseValue;
        ctrl.increaseValue = increaseValue;
        ctrl.isShownUnit = isShownUnit;
        ctrl.onChangeInput = onChangeInput;
        ctrl.onBlurInput = onBlurInput;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.allowEmptyField = lodash.defaultTo(ctrl.allowEmptyField, false);
            ctrl.defaultValue = lodash.defaultTo(ctrl.defaultValue, null);
            resizeInput();

            ctrl.currentValue = lodash.defaultTo(ctrl.currentValue, ctrl.disableZeroValue ? 1 : 0);
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
            if (lodash.isNil(ctrl.currentValue) && !ctrl.allowEmptyField) {
                return true;
            }

            return ctrl.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName);
        }

        /**
         * Method subtracts value from current value in input or sets current value to 0 it is below 0
         */
        function decreaseValue() {
            ctrl.currentValue = Math.max(Number(ctrl.currentValue) - Number(ctrl.valueStep), 0).toFixed(ctrl.precision);

            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(ctrl.currentValue.toString());
                ctrl.formObject[ctrl.inputName].$render();
            }

            // if value becomes zero - clear the input field
            if (ctrl.currentValue === 0 && ctrl.disableZeroValue) {
                ctrl.currentValue = null;
            }

            onCurrentValueChange();
        }

        /**
         * Method adds value to current value in input
         */
        function increaseValue() {
            ctrl.currentValue = (Number(ctrl.currentValue) + Number(ctrl.valueStep)).toFixed(ctrl.precision);

            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(ctrl.currentValue.toString());
                ctrl.formObject[ctrl.inputName].$render();
            }

            resizeInput();
            onCurrentValueChange();
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
            resizeInput();
        }

        /**
         * Handles on blur event
         */
        function onBlurInput() {
            ctrl.inputFocused = false;
            onCurrentValueChange();
        }

        //
        // Private methods
        //

        /**
         * Handles any changes of current value
         */
        function onCurrentValueChange() {
            validateCurrentValue();
            $timeout(function () {
                lodash.get(ctrl, 'onChange', angular.noop)(ctrl.checkInvalidation());
                resizeInput();
            }, 0);
        }

        /**
         * Resizes number input width
         */
        function resizeInput() {
            var numberInput = $element.find('input')[0];
            if (!lodash.isNil(numberInput)) {
                numberInput.size = !lodash.isEmpty(ctrl.currentValue) || lodash.isNumber(ctrl.currentValue) ? ctrl.currentValue.toString().length : !lodash.isEmpty(ctrl.placeholder) ? ctrl.placeholder.length : 1;
            }
        }

        /**
         * Resets the input to default value if it is invalid
         */
        function validateCurrentValue() {
            if (angular.isFunction(ctrl.updateNumberInputCallback)) {
                ctrl.updateNumberInputCallback({
                    newData: lodash.isNil(ctrl.currentValue) ? ctrl.defaultValue : Number(ctrl.currentValue),
                    field: angular.isDefined(ctrl.updateNumberInputField) ? ctrl.updateNumberInputField : ctrl.inputName
                });
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
            searchKeys: '<',
            searchStates: '<',
            placeholder: '@',
            liveSearch: '<?',
            searchCallback: '&?',
            isSearchHierarchically: '@?',
            type: '@?',
            ruleType: '@?',
            searchType: '@?'
        },
        templateUrl: 'igz_controls/components/search-input/search-input.tpl.html',
        controller: IgzSearchInputController
    });

    function IgzSearchInputController($scope, $timeout, lodash, SearchHelperService) {
        var ctrl = this;

        ctrl.isSearchHierarchically = String(ctrl.isSearchHierarchically) === 'true';
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

    IgzSliderInputBlockController.$inject = ['$rootScope', '$scope', '$timeout', 'lodash', 'ConvertorService'];
    angular.module('iguazio.dashboard-controls').component('igzSliderInputBlock', {
        bindings: {
            measureUnits: '<?',
            sliderConfig: '<',
            sliderBlockUpdatingBroadcast: '@'
        },
        templateUrl: 'igz_controls/components/slider-input-block/slider-input-block.tpl.html',
        controller: IgzSliderInputBlockController
    });

    function IgzSliderInputBlockController($rootScope, $scope, $timeout, lodash, ConvertorService) {
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

            // Bind needed callbacks to configuration objects with updated `ctrl.selectedData` values (for rz-slider library usage)
            ctrl.sliderConfig.options.onEnd = setValue;
            ctrl.sliderConfig.options.onChange = checkIfUnlimited;

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
         */
        function checkIfUnlimited() {
            ctrl.sliderConfig.valueLabel = ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ? 'U/L' : ctrl.sliderConfig.value;

            $timeout(function () {
                $rootScope.$broadcast('rzSliderForceRender');
            });
        }

        /**
         * Update slider data with values from external scope
         */
        function fillRange() {
            if (ctrl.selectedData) {
                var result = ConvertorService.getConvertedBytes(ctrl.selectedData[ctrl.sliderConfig.options.id]);

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
            ctrl.selectedData[ctrl.sliderConfig.options.id] = ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ? 0 : ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow);
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

    IgzSplashScreenController.$inject = ['$scope', '$state'];
    angular.module('iguazio.dashboard-controls').component('igzSplashScreen', {
        bindings: {
            isSplashShowed: '<'
        },
        templateUrl: 'igz_controls/components/splash-screen/splash-screen.tpl.html',
        controller: IgzSplashScreenController
    });

    function IgzSplashScreenController($scope, $state) {
        var ctrl = this;

        // public properties
        ctrl.isLoading = true;
        ctrl.isAlertShowing = false;
        ctrl.textToDisplay = 'Loading…';

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
     * onlyValidCharacters: allow only that characters which passed regex pattern
     * placeholderText: text that is displayed when input is empty
     * readOnly: is input should be readonly
     * spellcheck: disable spell check for some field, for example input for base64 string
     * updateDataCallback: triggered when input was changed by a user, added whn two-way binding was replased with one-way
     * updateDataField: field name for updateDataCallback
     * validationIsRequired: input can't be empty
     * validationMaxLength: value should be shorter or equal this value
     * validationPattern: validation with regex
     */

    IgzValidatingInputFieldController.$inject = ['$element', '$timeout', '$window', 'lodash', 'EventHelperService', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzValidatingInputField', {
        bindings: {
            compareInputValue: '<?',
            enterCallback: '<?',
            fieldType: '@',
            formObject: '<',
            hideCounter: '@?',
            inputIcon: '@',
            inputModelOptions: '<?',
            inputName: '@',
            inputValue: '<',
            isDisabled: '<?',
            isDataRevert: '@?',
            isFocused: '<?',
            itemBlurCallback: '&?',
            itemFocusCallback: '&?',
            onBlur: '&?',
            onlyValidCharacters: '@?',
            placeholderText: '@',
            readOnly: '<?',
            spellcheck: '@?',
            updateDataCallback: '&?',
            updateDataField: '@?',
            validationIsRequired: '@',
            validationMaxLength: '@',
            validationPattern: '<',
            isClearIcon: '<?'
        },
        templateUrl: 'igz_controls/components/validating-input-field/validating-input-field.tpl.html',
        controller: IgzValidatingInputFieldController
    });

    function IgzValidatingInputFieldController($element, $timeout, $window, lodash, EventHelperService, FormValidationService) {
        var ctrl = this;

        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 1000,
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
                var inputViewValue = ctrl.formObject[ctrl.inputName].$viewValue;

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
            return lodash.isNil(ctrl.hideCounter) || ctrl.hideCounter === 'false' ? true : false;
        }

        /**
         * Method to make input unfocused
         */
        function focusInput() {
            ctrl.inputFocused = true;
            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback();
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
                ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
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
                            ctrl.itemBlurCallback({ inputValue: ctrl.inputValue });
                        }
                        ctrl.startValue = Number(ctrl.data);
                    } else {

                        // Revert input value; Outer model value just does not change
                        ctrl.data = ctrl.inputValue;
                        if (angular.isFunction(ctrl.onBlur)) {
                            ctrl.onBlur();
                        }
                    }
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItemMore.$inject = ['$element', '$document', '$scope', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('igzActionItemMore', {
        bindings: {
            actions: '<?',
            onFilesDropped: '<?'
        },
        templateUrl: 'igz_controls/components/action-item/action-item-more/action-item-more.tpl.html',
        controller: IgzActionItemMore,
        transclude: true
    });

    function IgzActionItemMore($element, $document, $scope, DialogsService) {
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

    FunctionFromScratchController.$inject = ['$interval', '$state', '$stateParams', 'lodash', 'DialogsService', 'FunctionsService', 'NuclioFunctionsDataService', 'NuclioProjectsDataService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionFromScratch', {
        bindings: {
            project: '<',
            toggleSplashScreen: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/create-function/function-from-scratch/function-from-scratch.tpl.html',
        controller: FunctionFromScratchController
    });

    function FunctionFromScratchController($interval, $state, $stateParams, lodash, DialogsService, FunctionsService, NuclioFunctionsDataService, NuclioProjectsDataService, ValidatingPatternsService) {
        var ctrl = this;
        var interval = null;

        ctrl.functionData = {};
        ctrl.runtimes = [];
        ctrl.selectedRuntime = null;

        ctrl.$onInit = onInit;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onDropdownDataChange = onDropdownDataChange;

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.runtimes = getRuntimes();
            ctrl.selectedRuntime = getDefaultRuntime();

            initFunctionData();
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            $state.go('app.project.functions', {
                projectId: ctrl.project.metadata.name
            });
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction() {
            ctrl.toggleSplashScreen({ value: true });

            // create function only when form is valid
            if (ctrl.functionFromScratchForm.$valid) {
                lodash.set(ctrl, 'functionData.metadata.namespace', ctrl.project.metadata.namespace);

                $state.go('app.project.function.edit.code', {
                    isNewFunction: true,
                    id: ctrl.project.metadata.name,
                    functionId: ctrl.functionData.metadata.name,
                    projectNamespace: ctrl.project.metadata.namespace,
                    functionData: ctrl.functionData
                });
            }
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         * @param {string} field - field which should be filled
         */
        function inputValueCallback(data, field) {
            if (!lodash.isNil(data)) {
                lodash.set(ctrl, 'functionData.metadata.' + field, data);
            }
        }

        /**
         * Set data returned by default dropdown component
         * @param {Object} item - the new data
         * @param {boolean} isItemChanged - was value changed or not
         */
        function onDropdownDataChange(item, isItemChanged) {
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
                id: 'pypy',
                name: 'PyPy',
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
                    timeoutSeconds: 0,
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
                    },
                    minReplicas: 1,
                    maxReplicas: 1
                }
            };
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FunctionFromTemplateController.$inject = ['$interval', '$state', '$stateParams', '$q', 'lodash', 'DialogsService', 'FunctionsService', 'ValidatingPatternsService', 'NuclioFunctionsDataService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionFromTemplate', {
        bindings: {
            project: '<',
            toggleSplashScreen: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/create-function/function-from-template/function-from-template.tpl.html',
        controller: FunctionFromTemplateController
    });

    function FunctionFromTemplateController($interval, $state, $stateParams, $q, lodash, DialogsService, FunctionsService, ValidatingPatternsService, NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;
        var interval = null;

        ctrl.functionData = {};
        ctrl.selectedTemplate = '';
        ctrl.templates = [];

        ctrl.$onInit = onInit;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isTemplateSelected = isTemplateSelected;
        ctrl.selectTemplate = selectTemplate;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.toggleSplashScreen({ value: true });

            initFunctionData();
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            $state.go('app.project.functions', {
                projectId: ctrl.project.metadata.name
            });
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction() {

            // create function only when form is valid
            if (ctrl.functionFromTemplateForm.$valid && !lodash.isNil(ctrl.selectedTemplate)) {
                lodash.set(ctrl, 'functionData.metadata.namespace', ctrl.project.metadata.namespace);

                $state.go('app.project.function.edit.code', {
                    isNewFunction: true,
                    id: ctrl.project.metadata.name,
                    functionId: ctrl.functionData.metadata.name,
                    projectNamespace: ctrl.project.metadata.namespace,
                    functionData: ctrl.functionData
                });
            }
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         * @param {string} field - field which should be filled
         */
        function inputValueCallback(data, field) {
            if (!lodash.isNil(data)) {
                lodash.set(ctrl, 'functionData.metadata.' + field, data);
            }
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
         * Selects template.
         * Sets new template as selected
         * @param {Object} templateName - template to be set
         */
        function selectTemplate(templateName) {
            if (!lodash.isEqual(templateName, ctrl.selectedTemplate)) {
                ctrl.selectedTemplate = templateName;

                lodash.set(ctrl, 'functionData.spec.runtime', ctrl.templates[ctrl.selectedTemplate].spec.runtime);
                lodash.set(ctrl, 'functionData.spec.build.functionSourceCode', ctrl.templates[ctrl.selectedTemplate].spec.build.functionSourceCode);
            }
        }

        //
        // Private methods
        //

        /**
         * Gets default selected template
         * @returns {Object} template to be set as selected
         */
        function getSelectedTemplate() {
            return lodash.keys(ctrl.templates)[0];
        }

        /**
         * Initialize object for function from template
         */
        function initFunctionData() {

            // gets all available function templates
            NuclioFunctionsDataService.getTemplates().then(function (repsonse) {
                ctrl.templates = repsonse.data;
                ctrl.selectedTemplate = getSelectedTemplate();
                var selectedTemplate = ctrl.templates[ctrl.selectedTemplate];

                ctrl.functionData = {
                    metadata: {
                        name: '',
                        namespace: ''
                    },
                    spec: {
                        handler: FunctionsService.getHandler(selectedTemplate.spec.runtime),
                        runtime: selectedTemplate.spec.runtime,
                        build: {
                            functionSourceCode: selectedTemplate.spec.build.functionSourceCode
                        }
                    }
                };
            }).catch(function () {
                DialogsService.alert('Oops: Unknown error occurred');
            }).finally(function () {
                ctrl.toggleSplashScreen({ value: false });
            });
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    NclFunctionVersionRowController.$inject = ['$state', 'lodash', 'ConfigService', 'NuclioHeaderService', 'FunctionsService'];
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

    function NclFunctionVersionRowController($state, lodash, ConfigService, NuclioHeaderService, FunctionsService) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.title = {
            project: ctrl.project.spec.displayName,
            function: ctrl.function.metadata.name,
            version: ctrl.version.name
        };

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
                    message: 'Delete version “' + ctrl.version.name + '”?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
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

            NuclioHeaderService.updateMainHeader('Projects', ctrl.title, $state.current.name);
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

    NclFunctionEventDialogController.$inject = ['$timeout', 'lodash', 'EventHelperService', 'NuclioEventService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionEventDialog', {
        bindings: {
            closeDialog: '&',
            createEvent: '<',
            selectedEvent: '<',
            version: '<'

        },
        templateUrl: 'nuclio/projects/project/functions/version/function-event-dialog/function-event-dialog.tpl.html',
        controller: NclFunctionEventDialogController
    });

    function NclFunctionEventDialogController($timeout, lodash, EventHelperService, NuclioEventService) {
        var ctrl = this;

        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.buttonText = 'Create';
        ctrl.errorText = 'Error occurred while creating the new function event.';
        ctrl.titleText = 'Create function event';
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
        ctrl.onSelectHeader = onSelectHeader;
        ctrl.onSelectMethod = onSelectMethod;

        //
        // Hooks method
        //

        /**
         * Init method
         */
        function onInit() {

            // check if dialog was opened to create or edit test event.
            if (!ctrl.createEvent) {
                ctrl.titleText = 'Edit function event';
                ctrl.buttonText = 'Apply';
                ctrl.errorText = 'Error occurred while updating the function event.';
            }

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
                        }
                    },
                    body: ''
                }
            });

            // copy event to prevent modifying  the original object
            ctrl.workingCopy = angular.copy(ctrl.selectedEvent);

            ctrl.selectedMethod = lodash.find(ctrl.methods, ['id', lodash.get(ctrl.selectedEvent, 'spec.attributes.method')]);
            ctrl.selectedHeader = lodash.find(ctrl.headers, ['id', lodash.get(ctrl.selectedEvent, 'spec.attributes.headers.Content-Type')]);
        }

        //
        // Public methods
        //

        /**
         * Disables Edit mode and sends broadcast to nested settings component
         * @param {Event} event - JS event object
         */
        function applyChanges(event) {
            ctrl.functionEventForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.functionEventForm.$valid && ctrl.isFormChanged) {

                // show "Loading..." button
                ctrl.isLoadingState = true;

                NuclioEventService.deployEvent(ctrl.workingCopy, ctrl.createEvent).then(function () {
                    ctrl.isDeployFailed = false;

                    ctrl.closeDialog({ isEventDeployed: true });
                }).catch(function () {
                    ctrl.isDeployFailed = true;
                    ctrl.isLoadingState = false;
                });
            }
        }

        /**
         * Closes dialog
         */
        function closeEventDialog() {
            if (!ctrl.isLoadingState) {
                ctrl.closeDialog({ isEventDeployed: false });
            }
        }

        /**
         * Sets new data from "Name" field to event object
         * @param {string} newData - data to be set
         * @param {string} field - field which was changed
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.workingCopy, 'spec.displayName', newData);

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

            isFormChanged();
        }

        /**
         * Callback from body field.
         */
        function onChangeBody() {
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

    NclVersionCodeController.$inject = ['$element', '$stateParams', '$timeout', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionCode', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-code/version-code.tpl.html',
        controller: NclVersionCodeController
    });

    function NclVersionCodeController($element, $stateParams, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;
        ctrl.codeEntryTypeArray = [{
            id: 'online',
            visible: true,
            name: 'Edit online'
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
        ctrl.selectedTheme = ctrl.themesArray[0];

        // Config for scrollbar on code-tab view
        ctrl.scrollConfig = {
            axis: 'xy',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.selectEntryTypeValue = selectEntryTypeValue;
        ctrl.selectRuntimeValue = selectRuntimeValue;
        ctrl.selectThemeValue = selectThemeValue;
        ctrl.onCloseDropdown = onCloseDropdown;
        ctrl.inputValueCallback = inputValueCallback;

        ctrl.onChangeSourceCode = onChangeSourceCode;

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.runtimeArray = getRuntimes();
            ctrl.selectedRuntime = lodash.find(ctrl.runtimeArray, ['id', ctrl.version.spec.runtime]);
            ctrl.selectedEntryType = ctrl.codeEntryTypeArray[0];
            ctrl.sourceCode = atob(ctrl.version.spec.build.functionSourceCode);
        }

        //
        // Public methods
        //

        /**
         * Sets new value to entity type
         * @param {Object} item
         */
        function selectEntryTypeValue(item) {
            ctrl.selectedEntryType = item;
            ctrl.version.spec.entryType = item.name;
        }

        /**
         * Sets new selected theme for editor
         * @param {Object} item
         */
        function selectThemeValue(item) {
            ctrl.selectedTheme = item;
        }

        /**
         * Sets new value to runtime
         * @param {Object} item
         */
        function selectRuntimeValue(item) {
            ctrl.selectedRuntime = item;

            lodash.assign(ctrl.version.spec, {
                runtime: item.id,
                build: {
                    functionSourceCode: item.sourceCode
                }
            });
        }

        /**
         * Handles on drop-down close
         */
        function onCloseDropdown() {
            $timeout(function () {
                var element = angular.element('.tab-content-wrapper');
                var targetElement = $element.find('.default-dropdown-container');

                if (targetElement.length > 0 && ctrl.selectedEntryType.name !== 'Edit online') {
                    PreventDropdownCutOffService.resizeScrollBarContainer(element, '.default-dropdown-container');
                }
            }, 40);
        }

        /**
         * Changes function`s source code
         * @param {string} sourceCode
         */
        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', btoa(sourceCode));
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);
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
                name: 'Go',
                language: 'go',
                sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' + 'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' + '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                visible: true
            }, {
                id: 'python:2.7',
                name: 'Python 2.7',
                language: 'python',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'python:3.6',
                name: 'Python 3.6',
                language: 'python',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'pypy',
                name: 'PyPy',
                language: 'python',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            }, {
                id: 'dotnetcore',
                name: '.NET Core',
                language: 'csharp',
                sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' + 'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' + '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' + 'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' + 'fQ==', // source code in base64
                visible: true
            }, {
                id: 'java',
                name: 'Java',
                language: 'java',
                sourceCode: 'aW1wb3J0IGlvLm51Y2xpby5Db250ZXh0Ow0KaW1wb3J0IGlvLm51Y2xpby5FdmVudDsNCmltcG9ydCBpby5udWN' + 'saW8uRXZlbnRIYW5kbGVyOw0KaW1wb3J0IGlvLm51Y2xpby5SZXNwb25zZTsNCg0KcHVibGljIGNsYXNzIEhhbmRsZXIgaW1wbG' + 'VtZW50cyBFdmVudEhhbmRsZXIgew0KDQogICAgQE92ZXJyaWRlDQogICAgcHVibGljIFJlc3BvbnNlIGhhbmRsZUV2ZW50KENvb' + 'nRleHQgY29udGV4dCwgRXZlbnQgZXZlbnQpIHsNCiAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCkuc2V0Qm9keSgiIik7DQog' + 'ICAgfQ0KfQ==',
                visible: true
            }, {
                id: 'nodejs',
                language: 'javascript',
                sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' + 'rKCcnKTsNCn07', // source code in base64
                name: 'NodeJS',
                visible: true
            }, {
                id: 'shell',
                name: 'Shell',
                language: 'shellscript',
                sourceCode: '',
                visible: true
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationController.$inject = ['$stateParams', 'lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfiguration', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/version-configuration.tpl.html',
        controller: NclVersionConfigurationController
    });

    function NclVersionConfigurationController($stateParams, lodash, ConfigService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('nclEditVersionMonitoring', {
        templateUrl: 'nuclio/projects/project/functions/version/version-monitoring/version-monitoring.tpl.html',
        controller: NclVersionMonitoringController
    });

    function NclVersionMonitoringController() {
        var ctrl = this;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {}

        //
        // Public methods
        //

        //
        // Private method
        //
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionTriggerController.$inject = ['$stateParams', 'lodash', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionTrigger', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-trigger/version-trigger.tpl.html',
        controller: NclVersionTriggerController
    });

    function NclVersionTriggerController($stateParams, lodash, DialogsService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.triggers = [];

        ctrl.$onInit = onInit;
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
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            // get trigger list
            ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                var triggersItem = angular.copy(value);
                triggersItem.id = key;
                triggersItem.name = key;

                return triggersItem;
            });
        }

        //
        // Public methods
        //

        /**
         * Toggle create trigger mode
         * @returns {Promise}
         */
        function createTrigger(event) {
            if (!isTriggerInEditMode()) {
                ctrl.triggers.push({
                    id: '',
                    name: '',
                    kind: '',
                    attributes: {},
                    ui: {
                        editModeActive: true,
                        expanded: true
                    }
                });
            }
            event.stopPropagation();
        }

        /**
         * Edit trigger callback function
         * @returns {Promise}
         */
        function editTriggerCallback(item) {
            ctrl.handleAction('update', item);

            item.ui.editModeActive = false;
            item.ui.expanded = false;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} selectedItem - an object of selected trigger
         * @returns {Promise}
         */
        function handleAction(actionType, selectedItem) {
            var item = lodash.find(ctrl.triggers, ['id', selectedItem.id]);
            if (actionType === 'delete') {
                lodash.remove(ctrl.triggers, ['id', selectedItem.id]);
                lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
            } else if (actionType === 'edit') {
                if (!isTriggerInEditMode()) {
                    lodash.assign(item.ui, {
                        editModeActive: true,
                        expanded: true,
                        expandable: false
                    });
                }
            } else if (actionType === 'update') {
                if (!lodash.isEmpty(selectedItem.id)) {
                    lodash.unset(ctrl.version, 'spec.triggers.' + selectedItem.id);
                }

                item.id = selectedItem.name;

                var triggerItem = {
                    kind: selectedItem.kind,
                    attributes: selectedItem.attributes
                };

                if (angular.isDefined(selectedItem.url)) {
                    triggerItem.url = selectedItem.url;
                }

                if (angular.isDefined(selectedItem.maxWorkers)) {
                    triggerItem.maxWorkers = Number(selectedItem.maxWorkers);
                }

                lodash.set(ctrl.version, 'spec.triggers.' + selectedItem.name, triggerItem);

                // get trigger list
                ctrl.triggers = lodash.map(ctrl.version.spec.triggers, function (value, key) {
                    var triggersItem = angular.copy(value);
                    triggersItem.id = key;
                    triggersItem.name = key;

                    return triggersItem;
                });
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
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

(function () {
    'use strict';

    NclVersionConfigurationBasicSettingsController.$inject = ['lodash', 'ConfigService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationBasicSettings', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-basic-settings/version-configuration-basic-settings.tpl.html',
        controller: NclVersionConfigurationBasicSettingsController
    });

    function NclVersionConfigurationBasicSettingsController(lodash, ConfigService, ValidatingPatternsService) {
        var ctrl = this;

        ctrl.enableFunction = false;
        ctrl.enableTimeout = false;
        ctrl.timeout = {
            min: 0,
            sec: 0
        };

        ctrl.$onInit = onInit;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.inputValueCallback = inputValueCallback;
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
            if (lodash.includes(field, 'timeout')) {
                lodash.set(ctrl, field, Number(newData));

                lodash.set(ctrl.version, 'spec.timeoutSeconds', ctrl.timeout.min * 60 + ctrl.timeout.sec);
            } else {
                lodash.set(ctrl.version, field, newData);
            }
        }

        /**
         * Switches enable/disable function status
         */
        function updateEnableStatus() {
            lodash.set(ctrl.version, 'spec.disable', !ctrl.enableFunction);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationAnnotationsController.$inject = ['$element', '$stateParams', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationAnnotations', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-annotations/version-configuration-annotations.tpl.html',
        controller: NclVersionConfigurationAnnotationsController
    });

    function NclVersionConfigurationAnnotationsController($element, $stateParams, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.handleAction = handleAction;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            var annotations = lodash.get(ctrl.version, 'metadata.annotations', []);

            ctrl.annotations = lodash.map(annotations, function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: false
                    }
                };
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
            if (ctrl.annotations.length < 1 || lodash.last(ctrl.annotations).ui.isFormValid) {
                ctrl.annotations.push({
                    name: '',
                    value: '',
                    ui: {
                        editModeActive: true,
                        isFormValid: false
                    }
                });
                event.stopPropagation();
            }
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

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.annotations.length > 10;
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateAnnotations() {
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (annotation) {
                newAnnotations[annotation.name] = annotation.value;
            });

            lodash.set(ctrl.version, 'metadata.annotations', newAnnotations);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationBuildController.$inject = ['$stateParams', '$scope', '$timeout', 'lodash', 'ngDialog', 'Upload', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationBuild', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-build/version-configuration-build.tpl.html',
        controller: NclVersionConfigurationBuildController
    });

    function NclVersionConfigurationBuildController($stateParams, $scope, $timeout, lodash, ngDialog, Upload, ConfigService) {
        var ctrl = this;
        var uploadType = '';

        ctrl.datasetTypesList = [{
            value: 'alpine',
            name: 'Alpine'
        }, {
            value: 'jessie',
            name: 'Jessie'
        }];
        ctrl.actions = initActions();
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

        ctrl.$onInit = onInit;

        ctrl.deleteFile = deleteFile;
        ctrl.getFileConfig = getFileConfig;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.onBaseImageChange = onBaseImageChange;
        ctrl.onFireAction = onFireAction;
        ctrl.uploadFile = uploadFile;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.buildCommands = lodash.get(ctrl.version, 'spec.build.commands', []);

            ctrl.buildCommands = ctrl.buildCommands.join('\n');
        }

        //
        // Public methods
        //

        /**
         * Update spec.build.baseImage value
         * @param {Object} item
         */
        function onBaseImageChange(item) {
            ctrl.version.spec.build.baseImage = item.value;
        }

        /**
         * Update spec.buildCommands value
         * @param {string} newData
         */
        function inputValueCallback(newData) {
            ctrl.buildCommands = newData;
            ctrl.version.spec.build.commands = newData.replace('\r', '\n').split('\n');
        }

        /**
         * Returns uploading file config object
         * @return {Object}
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
                ctrl.uploadFile(data.value);
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
                label: 'Script',
                icon: 'ncl-icon-script',
                active: true
            }, {
                id: 'file',
                label: 'File',
                icon: 'ncl-icon-file',
                active: true
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationDataBindingsController.$inject = ['$stateParams', 'lodash', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationDataBindings', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-data-bindings/version-configuration-data-bindings.tpl.html',
        controller: NclVersionConfigurationDataBindingsController
    });

    function NclVersionConfigurationDataBindingsController($stateParams, lodash, DialogsService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.bindings = [];

        ctrl.$onInit = onInit;

        ctrl.createBinding = createBinding;
        ctrl.editBindingCallback = editBindingCallback;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            // get bindings list
            ctrl.bindings = lodash.map(ctrl.version.spec.dataBindings, function (value, key) {
                var bindingsItem = angular.copy(value);
                bindingsItem.id = key;
                bindingsItem.name = key;

                return bindingsItem;
            });
        }

        //
        // Public methods
        //

        /**
         * Toggle create binding mode
         * @param {Event} event
         */
        function createBinding(event) {
            ctrl.bindings.push({
                id: '',
                name: '',
                kind: '',
                attributes: {},
                ui: {
                    editModeActive: true,
                    expanded: true
                }
            });
            event.stopPropagation();
        }

        /**
         * Edit item callback function
         * @param {Object} item - selected item
         */
        function editBindingCallback(item) {
            ctrl.handleAction('update', item);

            item.ui.editModeActive = false;
            item.ui.expanded = false;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} selectedItem - an object of selected binding
         */
        function handleAction(actionType, selectedItem) {
            if (actionType === 'delete') {
                lodash.remove(ctrl.bindings, ['id', selectedItem.id]);
                lodash.unset(ctrl.version, 'spec.dataBindings.' + selectedItem.id);
            } else if (actionType === 'edit') {
                lodash.find(ctrl.bindings, ['id', selectedItem.id]).ui.editModeActive = true;
            } else if (actionType === 'update') {
                if (!lodash.isEmpty(selectedItem.id)) {
                    lodash.unset(ctrl.version, 'spec.dataBindings.' + selectedItem.id);
                }
                var bindingItem = {
                    kind: selectedItem.kind,
                    attributes: selectedItem.attributes
                };

                if (angular.isDefined(selectedItem.url)) {
                    bindingItem.url = selectedItem.url;
                }

                lodash.set(ctrl.version, 'spec.dataBindings.' + selectedItem.name, bindingItem);
                selectedItem.id = selectedItem.name;

                // get bindings list
                ctrl.bindings = lodash.map(ctrl.version.spec.dataBindings, function (value, key) {
                    var bindingsItem = angular.copy(value);
                    bindingsItem.id = key;
                    bindingsItem.name = key;

                    return bindingsItem;
                });
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationEnvironmentVariablesController.$inject = ['$element', '$stateParams', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationEnvironmentVariables', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
        controller: NclVersionConfigurationEnvironmentVariablesController
    });

    function NclVersionConfigurationEnvironmentVariablesController($element, $stateParams, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

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
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.variables = lodash.chain(ctrl.version).get('spec.env', []).map(function (variable) {
                variable.ui = {
                    editModeActive: false,
                    isFormValid: true
                };

                return variable;
            }).value();
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
            if (ctrl.variables.length < 1 || lodash.chain(ctrl.variables).last().get('ui.isFormValid', true).value()) {
                ctrl.variables.push({
                    name: '',
                    value: '',
                    ui: {
                        editModeActive: true,
                        isFormValid: false
                    }
                });
                event.stopPropagation();
            }
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
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.variables.length > 10;
        }

        /**
         * Updates function`s variables
         */
        function updateVariables() {
            ctrl.variables = lodash.map(ctrl.variables, function (variable) {
                return lodash.omit(variable, 'ui');
            });

            lodash.set(ctrl.version, 'spec.env', ctrl.variables);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationLabelsController.$inject = ['$element', '$timeout', 'lodash', 'PreventDropdownCutOffService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationLabels', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
        controller: NclVersionConfigurationLabelsController
    });

    function NclVersionConfigurationLabelsController($element, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewLabel = addNewLabel;
        ctrl.handleAction = handleAction;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var labels = lodash.get(ctrl.version, 'metadata.labels', []);

            ctrl.labels = lodash.map(labels, function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: false
                    }
                };
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
            if (ctrl.labels.length < 1 || lodash.last(ctrl.labels).ui.isFormValid) {
                ctrl.labels.push({
                    name: '',
                    value: '',
                    ui: {
                        editModeActive: true,
                        isFormValid: false
                    }
                });
                event.stopPropagation();
            }
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

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.labels.length > 10;
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateLabels() {
            var newLabels = {};

            lodash.forEach(ctrl.labels, function (label) {
                newLabels[label.name] = label.value;
            });

            lodash.set(ctrl.version, 'metadata.labels', newLabels);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationLoggingController.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationLogging', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-logging/version-configuration-logging.tpl.html',
        controller: NclVersionConfigurationLoggingController
    });

    function NclVersionConfigurationLoggingController(lodash) {
        var ctrl = this;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.setPriority = setPriority;

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
        }

        /**
         * Sets logger level
         * @param {Object} item
         */
        function setPriority(item) {
            lodash.set(ctrl.version, 'spec.loggerSinks[0].level', item.type);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionConfigurationResourcesController.$inject = ['$timeout', 'lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationResources', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-resources/version-configuration-resources.tpl.html',
        controller: NclVersionConfigurationResourcesController
    });

    function NclVersionConfigurationResourcesController($timeout, lodash, ConfigService) {
        var ctrl = this;

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.$onInit = onInit;

        ctrl.numberInputCallback = numberInputCallback;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.memorySliderConfig = {
                name: 'Memory',
                value: 0,
                valueLabel: '',
                pow: 0,
                unitLabel: 'MB',
                labelHelpIcon: false,
                options: {
                    floor: 1,
                    id: 'memory',
                    ceil: 1025,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.cpuSliderConfig = {
                name: 'CPU',
                value: 0,
                valueLabel: '',
                pow: 0,
                unitLabel: '',
                labelHelpIcon: false,
                options: {
                    floor: 1,
                    id: 'cpu',
                    ceil: 10,
                    showSelectionBar: false,
                    onChange: null,
                    onEnd: null
                }
            };
            ctrl.defaultMeasureUnits = [{
                pow: 1,
                name: 'KB'
            }, {
                pow: 2,
                name: 'MB'
            }, {
                pow: 3,
                name: 'GB'
            }];
            ctrl.minReplicas = lodash.chain(ctrl.version).get('spec.minReplicas').defaultTo(1).value();
            ctrl.maxReplicas = lodash.chain(ctrl.version).get('spec.maxReplicas').defaultTo(1).value();
        }

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function numberInputCallback(newData, field) {
            ctrl[field] = newData;
            $timeout(function () {
                if (ctrl.resourcesForm.$valid) {
                    lodash.set(ctrl.version.spec, 'minReplicas', ctrl.minReplicas);
                    lodash.set(ctrl.version.spec, 'maxReplicas', ctrl.maxReplicas);
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('nclVersionConfigurationRuntimeAttributes', {
        bindings: {
            version: '<'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
        controller: NclVersionConfigurationRuntimeAttributesController
    });

    function NclVersionConfigurationRuntimeAttributesController() {
        var ctrl = this;

        // TODO
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

(function () {
    'use strict';

    NclProjectsController.$inject = ['$filter', '$rootScope', '$scope', '$q', '$state', 'lodash', 'ngDialog', 'ActionCheckboxAllService', 'CommonTableService', 'ConfigService', 'NuclioProjectsDataService', 'ValidatingPatternsService'];
    angular.module('iguazio.dashboard-controls').component('nclProjects', {
        templateUrl: 'nuclio/projects/projects.tpl.html',
        controller: NclProjectsController
    });

    function NclProjectsController($filter, $rootScope, $scope, $q, $state, lodash, ngDialog, ActionCheckboxAllService, CommonTableService, ConfigService, NuclioProjectsDataService, ValidatingPatternsService) {
        var ctrl = this;

        ctrl.actions = [];
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
        ctrl.projects = [];
        ctrl.searchStates = {};
        ctrl.searchKeys = ['spec.displayName', 'spec.description'];
        ctrl.selectedProject = {};
        ctrl.sortOptions = [{
            label: 'Name',
            value: 'displayName',
            active: true
        }, {
            label: 'Description',
            value: 'description',
            active: false
        }, {
            label: 'Created by',
            value: 'created_by',
            active: false
        }, {
            label: 'Created date',
            value: 'created_date',
            active: false
        }];
        ctrl.sortedColumnName = 'displayName';

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.isColumnSorted = CommonTableService.isColumnSorted;

        ctrl.updateProjects = updateProjects;
        ctrl.handleAction = handleAction;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isProjectsListEmpty = isProjectsListEmpty;
        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onSortOptionsChange = onSortOptionsChange;
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
            $scope.$on('action-checkbox-all_check-all', updatePanelActions);
            $scope.$on('action-checkbox_item-checked', updatePanelActions);
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

            NuclioProjectsDataService.getProjects().then(function (response) {
                ctrl.projects = lodash.values(response);

                if (lodash.isEmpty(ctrl.projects)) {
                    $state.go('app.nuclio-welcome');
                } else {
                    ctrl.isSplashShowed.value = false;
                }
            });
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
                if (actionType === 'delete') {
                    lodash.forEach(checkedItems, function (checkedItem) {
                        lodash.remove(ctrl.projects, ['metadata.name', checkedItem.metadata.name]);

                        // unchecks deleted project
                        if (checkedItem.ui.checked) {
                            ActionCheckboxAllService.changeCheckedItemsCount(-1);
                        }
                    });
                } else {
                    ActionCheckboxAllService.setCheckedItemsCount(0);

                    ctrl.refreshProjects();
                }
            });
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
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(project)"></ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
                className: 'ngdialog-theme-nuclio'
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
            if (!isJustSorting) {

                // changes the order of sorting the column
                ctrl.isReverseSorting = columnName === ctrl.sortedColumnName ? !ctrl.isReverseSorting : false;
            }

            // saves the name of sorted column
            ctrl.sortedColumnName = columnName;

            ctrl.projects = $filter('orderBy')(ctrl.projects, 'spec.' + columnName, ctrl.isReverseSorting);
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
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Delete selected projects?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'nuclio_alert'
                }
            }, {
                label: 'Edit',
                id: 'edit',
                icon: 'igz-icon-properties',
                active: true
            }];
        }

        /**
         * Updates actions of action panel according to selected nodes
         */
        function updatePanelActions() {
            var checkedRows = lodash.filter(ctrl.projects, 'ui.checked');
            if (checkedRows.length > 0) {

                // sets visibility status of `edit action`
                // visible if only one project is checked
                var editAction = lodash.find(ctrl.actions, { 'id': 'edit' });
                if (!lodash.isNil(editAction)) {
                    editAction.visible = checkedRows.length === 1;
                }

                // sets confirm message for `delete action` depending on count of checked rows
                var deleteAction = lodash.find(ctrl.actions, { 'id': 'delete' });
                if (!lodash.isNil(deleteAction)) {
                    var message = checkedRows.length === 1 ? 'Delete project “' + checkedRows[0].spec.displayName + '”?' : 'Delete selected projects?';

                    deleteAction.confirm = {
                        message: message,
                        description: 'Deleted project cannot be restored.',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
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

    IgzEditProjectDialogController.$inject = ['$scope', 'lodash', 'EventHelperService', 'FormValidationService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclEditProjectDialog', {
        bindings: {
            project: '<',
            confirm: '&',
            closeDialog: '&'
        },
        templateUrl: 'nuclio/projects/edit-project-dialog/edit-project-dialog.tpl.html',
        controller: IgzEditProjectDialogController
    });

    function IgzEditProjectDialogController($scope, lodash, EventHelperService, FormValidationService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.data = {};
        ctrl.isLoadingState = false;
        ctrl.nameTakenError = false;
        ctrl.serverError = '';
        ctrl.nameValidationPattern = /^.{1,128}$/;

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
                $scope.editProjectForm.$submitted = true;

                if ($scope.editProjectForm.$valid) {
                    ctrl.isLoadingState = true;

                    // use data from dialog to create a new project
                    NuclioProjectsDataService.updateProject(ctrl.data).then(function () {
                        ctrl.confirm();
                    }).catch(function (error) {
                        var status = lodash.get(error, 'data.errors[0].status');

                        ctrl.serverError = status === 400 ? 'Missing mandatory fields' : status === 403 ? 'You do not have permissions to update project' : status === 405 ? 'Failed to create a project' : lodash.inRange(status, 500, 599) ? 'Server error' : 'Unknown error occurred. Retry later';
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
                ctrl.closeDialog();
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzNewProjectDialogController.$inject = ['$scope', 'lodash', 'moment', 'EventHelperService', 'FormValidationService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclNewProjectDialog', {
        bindings: {
            closeDialog: '&'
        },
        templateUrl: 'nuclio/projects/new-project-dialog/new-project-dialog.tpl.html',
        controller: IgzNewProjectDialogController
    });

    function IgzNewProjectDialogController($scope, lodash, moment, EventHelperService, FormValidationService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.data = {};
        ctrl.isLoadingState = false;
        ctrl.nameTakenError = false;
        ctrl.nameValidationPattern = /^.{1,128}$/;
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
                $scope.newProjectForm.$submitted = true;

                if ($scope.newProjectForm.$valid) {
                    ctrl.isLoadingState = true;

                    // TODO sets default `created_by` and `created_date` if they are not defined
                    lodash.defaultsDeep(ctrl.data, {
                        spec: {
                            created_by: 'admin',
                            created_date: moment().toISOString()
                        }
                    });

                    // use data from dialog to create a new project
                    NuclioProjectsDataService.createProject(ctrl.data).then(function () {
                        ctrl.closeDialog({ project: ctrl.data });
                    }).catch(function (error) {
                        var status = lodash.get(error, 'data.errors[0].status');

                        ctrl.serverError = status === 400 ? 'Missing mandatory fields' : status === 403 ? 'You do not have permissions to create new projects' : status === 405 ? 'Failed to create a new project. ' + 'The maximum number of projects is reached. ' + 'An existing project should be deleted first ' + 'before creating a new one.' : lodash.inRange(status, 500, 599) ? 'Server error' : 'Unknown error occurred. Retry later';
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
                    namespace: 'nuclio'
                },
                spec: {
                    displayName: '',
                    description: ''
                }
            };
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
            toNumberArray: toNumberArray
        };

        //
        // Public methods
        //

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
    }
})();
'use strict';

(function () {
    'use strict';

    NuclioClientService.$inject = ['$http', '$q', 'lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').factory('NuclioClientService', NuclioClientService);

    function NuclioClientService($http, $q, lodash, ConfigService) {

        var service = {
            buildUrlWithPath: buildUrlWithPath,
            makeRequest: makeRequest,
            isLoading: { value: false }
        };

        return service;

        //
        // Public methods
        //

        /**
         * Makes request to nuclio server
         * Provides mechanism that allows to check if the request in the progress
         * @param {Object} config - describing the request to be made and how it should be processed (for `$http`
         *     service)
         * @param {boolean} [showLoaderOnStart=false] - avoid showing splash screen when request is started, if `true`
         * @param {boolean} [hideLoaderOnEnd=false] - avoid hiding splash screen when request is finished, if `true`
         * @returns {*}
         */
        function makeRequest(config, showLoaderOnStart, hideLoaderOnEnd) {
            if (!showLoaderOnStart) {
                service.isLoading.value = true;
            }

            return $http(config).then(function (data) {
                if (!showLoaderOnStart && !hideLoaderOnEnd) {
                    service.isLoading.value = false;
                }

                return data;
            }).catch(function (error) {
                return $q.reject(error);
            });
        }

        /**
         * Builds absolute url with a file path
         * @param {number} itemId - a container ID
         * @param {string} path - a file path
         * @returns {string}
         */
        function buildUrlWithPath(itemId, path) {
            return buildUrl(itemId) + lodash.trimStart(path, '/ ');
        }

        //
        // Private methods
        //

        /**
         * Builds absolute url
         * @param {number} itemId - a container ID
         * @returns {string}
         */
        function buildUrl(itemId) {
            return lodash.trimEnd(ConfigService.url.nuclio.baseUrl, ' /') + '/' + itemId;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NuclioEventService.$inject = ['NuclioClientService'];
    angular.module('iguazio.dashboard-controls').factory('NuclioEventService', NuclioEventService);

    function NuclioEventService(NuclioClientService) {
        return {
            deleteEvent: deleteEvent,
            deployEvent: deployEvent,
            getEvents: getEvents,
            invokeFunction: invokeFunction
        };

        //
        // Public methods
        //

        /**
         * Sends request to delete event
         */
        function deleteEvent(eventData) {
            var headers = {
                'Content-Type': 'application/json'
            };

            var config = {
                data: eventData,
                method: 'delete',
                headers: headers,
                withCredentials: false,
                url: NuclioClientService.buildUrlWithPath('function_events')
            };

            return NuclioClientService.makeRequest(config);
        }

        /**
         * Sends request to deploy event
         * @param {Object} eventData - object with all needed data to deploy event
         * @param {boolean} isNewEvent - represents state of event (new event, or existing event)
         */
        function deployEvent(eventData, isNewEvent) {

            // check if it's a new event.
            // If yes, then send POST request, otherwise it's a update of exisiting event, so send PUT request
            var method = isNewEvent ? 'post' : 'put';
            var headers = {
                'Content-Type': 'application/json'
            };

            var config = {
                data: eventData,
                method: method,
                headers: headers,
                withCredentials: false,
                url: NuclioClientService.buildUrlWithPath('function_events')
            };

            return NuclioClientService.makeRequest(config);
        }

        /**
         * Gets list of events
         * @param {Object} functionData - object with all needed data to get events list
         */
        function getEvents(functionData) {
            var headers = {
                'x-nuclio-function-event-namespace': functionData.metadata.namespace,
                'x-nuclio-function-name': functionData.metadata.name
            };

            var config = {
                method: 'get',
                headers: headers,
                withCredentials: false,
                url: NuclioClientService.buildUrlWithPath('function_events')
            };

            return NuclioClientService.makeRequest(config);
        }

        /**
         * Invokes the function
         */
        function invokeFunction(eventData) {
            var headers = {
                'Content-Type': eventData.spec.attributes.headers['Content-Type'],
                'x-nuclio-function-namespace': eventData.metadata.namespace,
                'x-nuclio-function-name': eventData.metadata.labels['nuclio.io/function-name'],
                'x-nuclio-invoke-via': 'external-ip'
            };

            var config = {
                data: eventData.spec.body,
                method: eventData.spec.attributes.method,
                headers: headers,
                url: NuclioClientService.buildUrlWithPath('function_invocations')
            };

            return NuclioClientService.makeRequest(config);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NuclioFunctionsDataService.$inject = ['NuclioClientService'];
    angular.module('iguazio.dashboard-controls').factory('NuclioFunctionsDataService', NuclioFunctionsDataService);

    function NuclioFunctionsDataService(NuclioClientService) {
        return {
            createFunction: createFunction,
            deleteFunction: deleteFunction,
            initVersionActions: initVersionActions,
            getFunction: getFunction,
            getFunctions: getFunctions,
            getTemplates: getTemplates,
            updateFunction: updateFunction
        };

        //
        // Public methods
        //

        /**
         * Gets function details
         * @param {Object} functionData
         * @returns {Promise}
         */
        function createFunction(functionData, projectName) {
            var headers = {
                'Content-Type': 'application/json',
                'x-nuclio-function-namespace': functionData.metadata.namespace,
                'x-nuclio-project-name': projectName
            };

            var config = {
                data: functionData,
                method: 'post',
                headers: headers,
                withCredentials: false,
                url: NuclioClientService.buildUrlWithPath('functions')
            };

            return NuclioClientService.makeRequest(config);
        }

        /**
         * Gets function details
         * @param {Object} functionData
         * @returns {Promise}
         */
        function getFunction(functionData, projectName) {
            var headers = {
                'Content-Type': 'application/json',
                'x-nuclio-function-namespace': functionData.namespace,
                'x-nuclio-project-name': projectName
            };

            var config = {
                method: 'get',
                headers: headers,
                withCredentials: false,
                url: NuclioClientService.buildUrlWithPath('functions/') + functionData.name
            };

            return NuclioClientService.makeRequest(config).then(function (response) {
                return response.data;
            });
        }

        /**
         * Gets function details
         * @param {Object} functionData
         * @returns {Promise}
         */
        function deleteFunction(functionData) {
            var headers = {
                'Content-Type': 'application/json'
            };
            var config = {
                method: 'delete',
                url: NuclioClientService.buildUrlWithPath('functions'),
                headers: headers,
                data: {
                    'metadata': functionData
                },
                withCredentials: false
            };

            return NuclioClientService.makeRequest(config);
        }

        /**
         * Actions for Action panel
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var actions = [{
                label: 'Edit',
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Are you sure you want to delete selected version?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'critical_alert'
                }
            }];

            return actions;
        }

        /**
         * Gets functions list
         * @param {string} namespace
         * @returns {Promise}
         */
        function getFunctions(namespace, projectName) {
            var headers = {
                'x-nuclio-function-namespace': namespace,
                'x-nuclio-project-name': projectName
            };
            var config = {
                method: 'get',
                url: NuclioClientService.buildUrlWithPath('functions'),
                headers: headers,
                withCredentials: false
            };

            return NuclioClientService.makeRequest(config, false, false);
        }

        /**
         * Update existing function with new data
         * @param {Object} functionDetails
         * @returns {Promise}
         */
        function updateFunction(functionDetails, projectName) {
            var headers = {
                'Content-Type': 'application/json',
                'x-nuclio-function-namespace': functionDetails.metadata.namespace,
                'x-nuclio-project-name': projectName
            };
            var config = {
                method: 'post',
                url: NuclioClientService.buildUrlWithPath('functions'),
                headers: headers,
                data: functionDetails,
                withCredentials: false
            };

            return NuclioClientService.makeRequest(config);
        }

        /**
         * Gets templates for function
         * @returns {Promise}
         */
        function getTemplates() {
            var config = {
                method: 'get',
                withCredentials: false,
                url: NuclioClientService.buildUrlWithPath('function_templates')
            };

            return NuclioClientService.makeRequest(config);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NuclioHeaderService.$inject = ['$timeout', '$rootScope', '$state', 'lodash'];
    angular.module('iguazio.dashboard-controls').factory('NuclioHeaderService', NuclioHeaderService);

    function NuclioHeaderService($timeout, $rootScope, $state, lodash) {
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

    NuclioProjectsDataService.$inject = ['NuclioClientService'];
    angular.module('iguazio.dashboard-controls').factory('NuclioProjectsDataService', NuclioProjectsDataService);

    function NuclioProjectsDataService(NuclioClientService) {
        var service = {
            createProject: createProject,
            deleteProject: deleteProject,
            getProject: getProject,
            getProjects: getProjects,
            updateProject: updateProject
        };

        return service;

        //
        // Public methods
        //

        /**
         * Creates a new project
         * @param {Object} project - the project to create
         */
        function createProject(project) {
            var headers = {
                'Content-Type': 'application/json'
            };
            var data = {
                metadata: {
                    namespace: project.metadata.namespace
                },
                spec: project.spec
            };

            return NuclioClientService.makeRequest({
                method: 'POST',
                url: NuclioClientService.buildUrlWithPath('projects', ''),
                headers: headers,
                data: data,
                withCredentials: false
            }).then(function (response) {
                return response.data;
            });
        }

        /**
         * Deletes a project
         * @param {Object} project - the project to create
         */
        function deleteProject(project) {
            var headers = {
                'Content-Type': 'application/json'
            };
            var data = {
                metadata: project.metadata
            };

            return NuclioClientService.makeRequest({
                method: 'DELETE',
                url: NuclioClientService.buildUrlWithPath('projects', ''),
                headers: headers,
                data: data,
                withCredentials: false
            }).then(function (response) {
                return response.data;
            });
        }

        /**
         * Gets all projects
         * @returns {Promise}
         */
        function getProjects() {
            var headers = {
                'x-nuclio-project-namespace': '*'
            };

            return NuclioClientService.makeRequest({
                method: 'GET',
                url: NuclioClientService.buildUrlWithPath('projects', ''),
                headers: headers,
                withCredentials: false
            }).then(function (response) {
                return response.data;
            });
        }

        /**
         * Gets project by id
         * @param {string} id - id of project
         * @returns {Promise}
         */
        function getProject(id) {
            var headers = {
                'x-nuclio-project-namespace': '*'
            };

            return NuclioClientService.makeRequest({
                method: 'GET',
                url: NuclioClientService.buildUrlWithPath('projects/', id),
                headers: headers,
                withCredentials: false
            }).then(function (response) {
                return response.data;
            });
        }

        /**
         * Updates a new project
         * @param {Object} project - the project to update
         */
        function updateProject(project) {
            var headers = {
                'Content-Type': 'application/json'
            };
            var data = {
                metadata: project.metadata,
                spec: project.spec
            };

            return NuclioClientService.makeRequest({
                method: 'PUT',
                url: NuclioClientService.buildUrlWithPath('projects', ''),
                headers: headers,
                data: data,
                withCredentials: false
            }).then(function (response) {
                return response.data;
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclProjectController.$inject = ['$state', '$timeout', 'ConfigService', 'HeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclProject', {
        bindings: {},
        templateUrl: 'nuclio/projects/project/ncl-project.tpl.html',
        controller: NclProjectController
    });

    function NclProjectController($state, $timeout, ConfigService, HeaderService) {
        var ctrl = this;
    }
})();
'use strict';

(function () {
    'use strict';

    NclProjectsTableRowController.$inject = ['$scope', '$state', 'lodash', 'moment', 'ngDialog', 'ActionCheckboxAllService', 'ConfigService', 'DialogsService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclProjectsTableRow', {
        bindings: {
            project: '<',
            projectsList: '<',
            actionHandlerCallback: '&'
        },
        templateUrl: 'nuclio/projects/projects-table-row/projects-table-row.tpl.html',
        controller: NclProjectsTableRowController
    });

    function NclProjectsTableRowController($scope, $state, lodash, moment, ngDialog, ActionCheckboxAllService, ConfigService, DialogsService, NuclioProjectsDataService) {
        var ctrl = this;

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

            // initialize `deleteProject`, `editProjects` actions and assign them to `ui` property of current project
            // TODO sets default `created_by` and `created_date` if they are not defined
            // initialize `checked` status to `false`
            lodash.defaultsDeep(ctrl.project, {
                spec: {
                    created_by: 'admin',
                    created_date: moment().toISOString()
                },
                ui: {
                    checked: false,
                    delete: deleteProject,
                    edit: editProject
                }
            });

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
         */
        function deleteProject() {
            NuclioProjectsDataService.deleteProject(ctrl.project).catch(function (error) {
                var errorMessages = {
                    403: 'You do not have permissions to delete this project.',
                    default: 'Unknown error occurred while deleting the project.'
                };

                return DialogsService.alert(lodash.get(errorMessages, error.status, errorMessages.default));
            });
        }

        /**
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [{
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Delete project “' + ctrl.project.spec.displayName + '“?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    description: 'Deleted project cannot be restored.',
                    type: 'nuclio_alert'
                }
            }, {
                label: 'Edit',
                id: 'edit',
                icon: 'igz-icon-properties',
                active: true
            }];
        }

        /**
         * Opens `Edit project` dialog
         */
        function editProject() {
            return ngDialog.openConfirm({
                template: '<ncl-edit-project-dialog data-project="$ctrl.project" data-confirm="confirm()"' + 'data-close-dialog="closeThisDialog(newProject)"></ncl-edit-project-dialog>',
                plain: true,
                scope: $scope,
                className: 'ngdialog-theme-nuclio'
            }).then(function () {

                // unchecks project before updating list
                if (ctrl.project.ui.checked) {
                    ctrl.project.ui.checked = false;

                    ActionCheckboxAllService.changeCheckedItemsCount(-1);
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclProjectsWelcomePageController.$inject = ['$scope', '$state', 'ngDialog'];
    angular.module('iguazio.dashboard-controls').component('nclProjectsWelcomePage', {
        templateUrl: 'nuclio/projects/projects-welcome-page/projects-welcome-page.tpl.html',
        controller: NclProjectsWelcomePageController
    });

    function NclProjectsWelcomePageController($scope, $state, ngDialog) {
        var ctrl = this;

        ctrl.$onDestroy = onDestroy;

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
         * Handle click on `Create new project` button
         * @param {Object} event
         */
        function openNewProjectDialog(event) {
            ngDialog.open({
                template: '<ncl-new-project-dialog data-close-dialog="closeThisDialog(newProject)"></ncl-new-project-dialog>',
                plain: true,
                scope: $scope,
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

    NclBreadcrumbsController.$inject = ['$timeout', '$element', '$rootScope', '$scope', '$state', '$window', 'NavigationTabsService', 'lodash'];
    angular.module('iguazio.dashboard-controls').component('nclBreadcrumbs', {
        templateUrl: 'nuclio/common/components/breadcrumbs/breadcrumbs.tpl.html',
        controller: NclBreadcrumbsController
    });

    function NclBreadcrumbsController($timeout, $element, $rootScope, $scope, $state, $window, NavigationTabsService, lodash) {
        var ctrl = this;

        ctrl.mainHeaderTitle = {};

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.goToProjectsList = goToProjectsList;
        ctrl.goToFunctionsList = goToFunctionsList;

        //
        // Hook methods
        //

        /**
         * Initialization function
         */
        function onInit() {
            setMainHeaderTitle();

            $scope.$on('update-main-header-title', setMainHeaderTitle);
            $scope.$on('$stateChangeSuccess', onStateChangeSuccess);
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
         * @param {Object} event
         * @param {Object} toState
         */
        function onStateChangeSuccess(event, toState) {
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

    NclBreadcrumbsDropdown.$inject = ['$document', '$element', '$rootScope', '$scope', '$state', 'lodash', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclBreadcrumbsDropdown', {
        bindings: {
            state: '<',
            title: '<'
        },
        templateUrl: 'nuclio/common/components/breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
        controller: NclBreadcrumbsDropdown
    });

    function NclBreadcrumbsDropdown($document, $element, $rootScope, $scope, $state, lodash, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.itemsList = [];
        ctrl.showDropdownList = false;
        ctrl.placeholder = 'Search...';

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
            if (lodash.startsWith(ctrl.state, 'app.project.functions')) {
                NuclioProjectsDataService.getProjects().then(setNuclioItemsList);
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
            ctrl.showDropdownList = !ctrl.showDropdownList;

            if (!ctrl.showDropdownList) {
                ctrl.searchText = '';

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
            lodash.set(params, 'projectId', item.id);

            ctrl.showDropdownList = !ctrl.showDropdownList;
            ctrl.searchText = '';

            $document.off('click', unselectDropdown);

            $state.go(ctrl.state, params);
        }

        //
        // Private method
        //

        /**
         * Handles promise
         * Sets items list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setNuclioItemsList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.spec.displayName,
                    isNuclioState: true
                };
            });
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
                });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclEditItemController.$inject = ['$document', '$element', '$scope', 'lodash', 'ConverterService', 'FunctionsService', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('nclEditItem', {
        bindings: {
            item: '<',
            type: '@',
            onSubmitCallback: '&'
        },
        templateUrl: 'nuclio/common/components/edit-item/edit-item.tpl.html',
        controller: NclEditItemController
    });

    function NclEditItemController($document, $element, $scope, lodash, ConverterService, FunctionsService, FormValidationService) {
        var ctrl = this;

        ctrl.classList = [];
        ctrl.selectedClass = {};

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.numberValidationPattern = /^\d+$/;
        ctrl.arrayIntValidationPattern = /^[-,0-9]+$/;
        ctrl.arrayStrValidationPattern = /^.{1,128}$/;
        ctrl.stringValidationPattern = /^.{1,128}$/;

        ctrl.isShowFieldError = FormValidationService.isShowFieldError;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.isNil = lodash.isNil;

        ctrl.getAttrValue = getAttrValue;
        ctrl.getValidationPattern = getValidationPattern;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isClassSelected = isClassSelected;
        ctrl.onSubmitForm = onSubmitForm;
        ctrl.onSelectClass = onSelectClass;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('deploy-function-version', ctrl.onSubmitForm);
            $document.on('click', function (event) {
                if (!lodash.isNil(ctrl.editItemForm)) {
                    onSubmitForm(event);
                }
            });

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);
            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
            }
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
         * Returns the value of an attribute
         * @param {string} newData
         * @returns {string}
         */
        function getAttrValue(attrName) {
            return lodash.get(ctrl.item, 'attributes.' + attrName);
        }

        /**
         * Gets validation patterns depends on type of attribute
         * @param {string} pattern
         * @returns {RegExp}
         */
        function getValidationPattern(pattern) {
            return pattern === 'number' ? ctrl.numberValidationPattern : pattern === 'arrayInt' ? ctrl.arrayIntValidationPattern : pattern === 'arrayStr' ? ctrl.arrayStrValidationPattern : ctrl.stringValidationPattern;
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.item, field, newData);
        }

        /**
         * Determine whether the item class was selected
         * @returns {boolean}
         */
        function isClassSelected() {
            return !lodash.isEmpty(ctrl.selectedClass);
        }

        /**
         * Update item class callback
         * @param {Object} item - item class\kind
         */
        function onSelectClass(item) {
            ctrl.item = lodash.omit(ctrl.item, ['maxWorkers', 'url']);

            var nameDirty = ctrl.editItemForm.itemName.$dirty;
            var nameInvalid = ctrl.editItemForm.itemName.$invalid;

            ctrl.item.kind = item.id;
            ctrl.selectedClass = item;
            ctrl.item.attributes = {};

            if (!lodash.isNil(item.url)) {
                ctrl.item.url = '';
            }

            if (!lodash.isNil(item.maxWorkers)) {
                ctrl.item.maxWorkers = '';
            }

            lodash.each(item.attributes, function (attribute) {
                lodash.set(ctrl.item.attributes, attribute.name, '');
            });

            // set form pristine to not validate new form fields
            ctrl.editItemForm.$setPristine();

            // if itemName is invalid - set it dirty to show validation message
            if (nameDirty && nameInvalid) {
                ctrl.editItemForm.itemName.$setDirty();
            }
        }

        //
        // Private methods
        //

        /**
         * On submit form handler
         * Hides the item create/edit mode
         * @param {MouseEvent} event
         */
        function onSubmitForm(event) {
            if (angular.isUndefined(event.keyCode) || event.keyCode === '13') {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    if (ctrl.editItemForm.$invalid) {
                        ctrl.item.ui.expandable = false;
                        ctrl.editItemForm.itemName.$setDirty();

                        // set form as submitted
                        ctrl.editItemForm.$setSubmitted();
                    } else {
                        ctrl.item.ui.expandable = true;

                        lodash.forEach(ctrl.selectedClass.attributes, function (attribute) {
                            if (attribute.pattern === 'number') {
                                lodash.set(ctrl.item, 'attributes[' + attribute.name + ']', Number(ctrl.item.attributes[attribute.name]));
                            }

                            if (attribute.pattern === 'arrayStr' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                ctrl.item.attributes[attribute.name] = ctrl.item.attributes[attribute.name].split(',');
                            }

                            if (attribute.pattern === 'arrayInt' && !lodash.isArray(ctrl.item.attributes[attribute.name])) {
                                ctrl.item.attributes[attribute.name] = ConverterService.toNumberArray(ctrl.item.attributes[attribute.name]);
                            }
                        });

                        ctrl.onSubmitCallback({ item: ctrl.item });
                    }
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclKeyValueInputController.$inject = ['$document', '$element', '$scope', 'lodash', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('nclKeyValueInput', {
        bindings: {
            actionHandlerCallback: '&',
            changeDataCallback: '&',
            itemIndex: '<',
            rowData: '<',
            useType: '<',
            listClass: '@?'
        },
        templateUrl: 'nuclio/common/components/key-value-input/key-value-input.tpl.html',
        controller: NclKeyValueInputController
    });

    function NclKeyValueInputController($document, $element, $scope, lodash, EventHelperService) {
        var ctrl = this;

        ctrl.data = {};
        ctrl.typesList = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.closeDropdown = closeDropdown;
        ctrl.getInputValue = getInputValue;
        ctrl.getType = getType;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onFireAction = onFireAction;
        ctrl.openDropdown = openDropdown;
        ctrl.onTypeChanged = onTypeChanged;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.data = lodash.cloneDeep(ctrl.rowData);
            ctrl.editMode = lodash.get(ctrl.data, 'ui.editModeActive', false);

            ctrl.actions = initActions();
            ctrl.typesList = getTypesList();

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', saveChanges);
            $document.off('keypress', saveChanges);
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

                return specificType === 'value' ? value : value.name + (!lodash.isNil(value.key) ? ':' + value.key : '');
            } else {
                return ctrl.data.value;
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
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (lodash.includes(field, 'value') && ctrl.getType() !== 'value') {
                var keyValueData = newData.split(':');

                lodash.set(ctrl.data, getValueField(), {
                    name: keyValueData[0]
                });

                if (keyValueData.length > 1) {
                    var data = lodash.get(ctrl.data, getValueField());

                    data.key = keyValueData[1];
                }
            } else {
                ctrl.data[field] = newData;
            }
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            if (actionType === 'edit') {
                ctrl.editMode = true;

                $document.on('click', saveChanges);
                $document.on('keypress', saveChanges);
            } else {
                ctrl.actionHandlerCallback({ actionType: actionType, index: ctrl.itemIndex });

                ctrl.editMode = false;
            }
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
                } else {
                    ctrl.data = lodash.omit(ctrl.data, 'valueFrom');
                    lodash.set(ctrl.data, 'value', '');
                }
            }
        }

        /**
         * On open default dropdown
         */
        function openDropdown() {
            var parent = angular.element(document).find('.' + ctrl.listClass)[0];
            var dropdown = angular.element(document).find('.' + ctrl.listClass + ' .default-dropdown-container')[0];
            var parentRect = parent.getBoundingClientRect();
            var dropdownRect = dropdown.getBoundingClientRect();

            parent = angular.element(parent);

            if (dropdownRect.bottom > parentRect.bottom) {
                parent.css({ 'padding-bottom': dropdownRect.bottom - parentRect.bottom + 'px' });
            }
        }

        /**
         * On close default dropdown
         */
        function closeDropdown() {
            var parent = angular.element(angular.element(document).find('.' + ctrl.listClass)[0]);
            parent.css({ 'padding-bottom': '0px' });
        }

        //
        // Private method
        //

        /**
         * Gets types list
         * @returns {Array.<Object>}
         */
        function getTypesList() {
            return [{
                id: 'value',
                name: 'Value'
            }, {
                id: 'secret',
                name: 'Secret'
            }, {
                id: 'configmap',
                name: 'Configmap'
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
                label: 'Edit',
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Are you sure you want to delete selected item?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'critical_alert'
                }
            }];
        }

        /**
         * Calls callback with new data
         * @param {Event} event
         */
        function saveChanges(event) {
            if ($element.find(event.target).length === 0 || event.keyCode === EventHelperService.ENTER) {
                ctrl.keyValueInputForm.$submitted = true;
                if (ctrl.keyValueInputForm.$valid) {
                    ctrl.data.ui = {
                        editModeActive: false,
                        isFormValid: true
                    };
                    $scope.$evalAsync(function () {
                        ctrl.editMode = false;

                        $document.off('click', saveChanges);
                        $document.off('keypress', saveChanges);

                        ctrl.changeDataCallback({ newData: ctrl.data, index: ctrl.itemIndex });
                    });
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclCollapsingRowController.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').component('nclCollapsingRow', {
        bindings: {
            actionHandlerCallback: '&',
            item: '<'
        },
        templateUrl: 'nuclio/common/components/collapsing-row/collapsing-row.tpl.html',
        controller: NclCollapsingRowController,
        transclude: true
    });

    function NclCollapsingRowController(lodash) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.isEditModeActive = false;

        ctrl.$onInit = onInit;

        ctrl.isNil = lodash.isNil;

        ctrl.onFireAction = onFireAction;
        ctrl.toggleItem = toggleItem;
        ctrl.onCollapse = onCollapse;

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
                    expanded: false,
                    expandable: true
                }
            });

            ctrl.actions = initActions();
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, selectedItem: ctrl.item });
        }

        /**
         * Enables/disables item
         */
        function toggleItem() {
            ctrl.item.enable = !ctrl.item.enable;
        }

        /**
         * Changes item's expanded state
         */
        function onCollapse() {
            if (ctrl.item.ui.expandable) {
                ctrl.item.ui.expanded = !ctrl.item.ui.expanded;
            }
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
                label: 'Edit',
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Delete item?',
                    description: 'Deleted item cannot be restored.',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'nuclio_alert'
                }
            }];
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('nclNavigationTabs', {
        bindings: {
            tabItems: '<'
        },
        templateUrl: 'nuclio/common/components/navigation-tabs/navigation-tabs.tpl.html'
    });
})();
'use strict';

(function () {
    'use strict';

    NavigationTabsService.$inject = ['lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').factory('NavigationTabsService', NavigationTabsService);

    function NavigationTabsService(lodash, ConfigService) {
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
            var config = [{
                tabName: 'Overview',
                uiRoute: 'app.container.overview',
                capability: 'containers.overview'
            }, {
                tabName: 'Browse',
                uiRoute: 'app.container.browser',
                capability: 'containers.browse'
            }, {
                tabName: 'Data Access Policy',
                uiRoute: 'app.container.data-access-policy',
                capability: 'containers.dataPolicy'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: 'Data Lifecycle',
                    uiRoute: 'app.container.data-lifecycle',
                    capability: 'containers.dataLifecycle'
                });
            }

            if (ConfigService.isDemoMode()) {
                config.splice(1, 0, {
                    tabName: 'Analytics',
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
            return [{
                tabName: 'Nodes',
                uiRoute: 'app.cluster.nodes',
                capability: 'clusters.nodes'
            }];
        }

        /**
         * Returns storage pools navigation tabs config
         * @returns {Array.<Object>}
         */
        function getStoragePoolsConfig() {
            var config = [{
                tabName: 'Overview',
                uiRoute: 'app.storage-pool.overview',
                capability: 'storagePools.overview'
            }, {
                tabName: 'Devices',
                uiRoute: 'app.storage-pool.devices',
                capability: 'storagePools.listDevices'
            }];

            if (ConfigService.isStagingMode()) {
                config.splice(1, 0, {
                    tabName: 'Containers',
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
            return [{
                tabName: 'Logs',
                uiRoute: 'app.control-panel.logs'
            }];
        }

        /**
         * Returns identity navigation tabs config
         * @returns {Array.<Object>}
         */
        function getIdentityConfig() {
            var config = [{
                tabName: 'Users',
                uiRoute: 'app.identity.users',
                capability: 'identity.users'
            }, {
                tabName: 'Groups',
                uiRoute: 'app.identity.groups',
                capability: 'identity.groups'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: 'IDP',
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
            var config = [{
                tabName: 'Event Log',
                uiRoute: 'app.events.event-log',
                capability: 'events.eventLog'
            }, {
                tabName: 'Alerts',
                uiRoute: 'app.events.alerts',
                capability: 'events.alerts'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: 'Escalation',
                    uiRoute: 'app.events.escalation',
                    capability: 'events.escalations'
                }, {
                    tabName: 'Tasks',
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

    NclMonacoController.$inject = ['$scope'];
    angular.module('iguazio.dashboard-controls').component('nclMonaco', {
        bindings: {
            language: '<',
            functionSourceCode: '<',
            onChangeSourceCodeCallback: '&',
            selectedTheme: '<'
        },
        templateUrl: 'nuclio/common/components/monaco/monaco.tpl.html',
        controller: NclMonacoController
    });

    function NclMonacoController($scope) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.selectedCodeFile = {
                language: ctrl.language,
                code: atob(ctrl.functionSourceCode)
            };

            $scope.$watch('selectedCodeFile.code', function () {
                if (angular.isFunction(ctrl.onChangeSourceCodeCallback)) {
                    ctrl.onChangeSourceCodeCallback({ sourceCode: $scope.selectedCodeFile.code });
                }
            });
        }

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.language) && angular.isDefined(changes.functionSourceCode)) {
                if (!changes.language.isFirstChange() && !changes.functionSourceCode.isFirstChange()) {
                    $scope.selectedCodeFile = {
                        language: changes.language.currentValue,
                        code: atob(changes.functionSourceCode.currentValue)
                    };
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    require.config({ paths: { 'vs': '/assets/monaco-editor/min/vs' } });

    angular.module('iguazio.dashboard-controls').directive('igzMonacoEditor', ['$interval', function ($interval) {
        // console.log('in igzMonacoEditor');
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
                    updateScope: function updateScope() {
                        this.scope.codeFile.code = this.editor.getValue();
                    },
                    onCodeFileChanged: function onCodeFileChanged(newValue, oldValue) {

                        // update the language model (and set `insertSpaces`)
                        var newModel = window.monaco.editor.createModel('', newValue.language);
                        newModel.updateOptions({ insertSpaces: this.getValueOrDefault(newValue.useSpaces, true) });
                        this.editor.setModel(newModel);

                        // update the code
                        this.editor.setValue(newValue.code);
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
                    language: scope.codeFile.language,
                    theme: 'vs',
                    // fontFamily: 'Roboto, sans-serif',
                    // lineNumbersMinChars: 2,
                    // lineHeight: 30,
                    // lineDecorationsWidth: 5,
                    automaticLayout: true
                    // scrollBeyondLastLine: false
                });

                // TODO - look up api docs to find a suitable event to handle as the onDidChangeModelContent event only seems to fire for certain changes!
                // As a fallback, currently updating scope on a timer...
                // editor.onDidChangeModelContent = function(e){
                //   console.log('modelContent changed');
                //   scope.code = editor.getValue();
                //   scope.$apply();
                // }
                interval = $interval(editorContext.updateScope.bind(editorContext), 1000);

                // set up watch for codeFile changes to reflect updates
                scope.$watch('codeFile', editorContext.onCodeFileChanged.bind(editorContext));
                scope.$watch('editorTheme', editorContext.onThemeChanged.bind(editorContext));

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
                editorTheme: '=editorTheme'
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

    FunctionsController.$inject = ['$filter', '$q', '$rootScope', '$scope', '$state', '$stateParams', '$timeout', 'lodash', 'CommonTableService', 'ConfigService', 'NuclioHeaderService', 'NuclioProjectsDataService', 'NuclioFunctionsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctions', {
        templateUrl: 'nuclio/projects/project/functions/functions.tpl.html',
        controller: FunctionsController
    });

    function FunctionsController($filter, $q, $rootScope, $scope, $state, $stateParams, $timeout, lodash, CommonTableService, ConfigService, NuclioHeaderService, NuclioProjectsDataService, NuclioFunctionsDataService) {
        var ctrl = this;
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
            label: 'Name',
            value: 'metadata.name',
            active: true
        }, {
            label: 'Description',
            value: 'spec.description',
            active: false
        }, {
            label: 'Status',
            value: 'status.state',
            active: false
        }, {
            label: 'Replicas',
            value: 'spec.replicas',
            active: false
        }, {
            label: 'Runtime',
            value: 'spec.runtime',
            active: false
        }];
        ctrl.sortedColumnName = 'metadata.name';

        ctrl.$onInit = onInit;

        ctrl.isColumnSorted = CommonTableService.isColumnSorted;

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
            if (angular.isDefined($stateParams.projectId)) {
                ctrl.isSplashShowed.value = true;

                NuclioProjectsDataService.getProject($stateParams.projectId).then(function (project) {
                    ctrl.project = project;

                    title.project = ctrl.project.spec.displayName;

                    ctrl.refreshFunctions();

                    NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
                });
            } else {
                ctrl.refreshFunctions();
            }

            ctrl.actions = NuclioFunctionsDataService.initVersionActions();

            $scope.$on('$stateChangeStart', stateChangeStart);
            $scope.$on('action-panel_fire-action', onFireAction);
            $scope.$on('action-checkbox_item-checked', updatePanelActions);
            $scope.$on('action-checkbox-all_check-all', function () {
                $timeout(updatePanelActions);
            });

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
                if (actionType === 'delete') {
                    lodash.forEach(checkedItems, function (checkedItem) {
                        lodash.remove(ctrl.functions, ['metadata.name', checkedItem.metadata.name]);
                    });
                } else {
                    ctrl.refreshFunctions();
                }
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

            NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);

            $state.go('app.project.create-function');
        }

        /**
         * Refreshes function list
         */
        function refreshFunctions() {
            ctrl.isSplashShowed.value = true;

            NuclioFunctionsDataService.getFunctions(ctrl.project.metadata.namespace, ctrl.project.metadata.name).then(function (result) {
                ctrl.functions = lodash.toArray(result.data);

                // TODO: unmock versions data
                lodash.forEach(ctrl.functions, function (functionItem) {
                    lodash.set(functionItem, 'versions', [{
                        name: '$LATEST',
                        invocation: '30',
                        last_modified: '2018-02-05T17:07:48.509Z'
                    }]);
                    lodash.set(functionItem, 'spec.version', 1);
                });

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
                    var message = checkedRows.length === 1 ? 'Delete version “' + checkedRows[0].name + '”?' : 'Are you sure you want to delete selected version?';

                    deleteAction.confirm = {
                        message: message,
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
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

    FunctionsService.$inject = ['$stateParams'];
    angular.module('iguazio.dashboard-controls').factory('FunctionsService', FunctionsService);

    function FunctionsService($stateParams) {
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
                    id: 'kafka',
                    name: 'Kafka',
                    url: 'string',
                    attributes: [{
                        name: 'topic',
                        pattern: 'string'
                    }, {
                        name: 'partitions',
                        pattern: 'arrayInt'
                    }]
                }, {
                    id: 'rabbit_mq',
                    name: 'RabbitMQ',
                    url: 'string',
                    attributes: [{
                        name: 'exchangeName',
                        pattern: 'string'
                    }, {
                        name: 'queueName',
                        pattern: 'string'
                    }, {
                        name: 'topics',
                        pattern: 'arrayStr'
                    }]
                }, {
                    id: 'nats',
                    name: 'Nats',
                    url: 'string',
                    attributes: [{
                        name: 'topic',
                        pattern: 'string'
                    }]
                }, {
                    id: 'cron',
                    name: 'Cron',
                    attributes: [{
                        name: 'interval',
                        pattern: 'string'
                    }, {
                        name: 'schedule',
                        pattern: 'string'
                    }]
                }, {
                    id: 'eventhub',
                    name: 'Eventhub',
                    attributes: [{
                        name: 'sharedAccessKeyName',
                        pattern: 'string'
                    }, {
                        name: 'sharedAccessKeyValue',
                        pattern: 'string'
                    }, {
                        name: 'namespace',
                        pattern: 'string'
                    }, {
                        name: 'eventHubName',
                        pattern: 'string'
                    }, {
                        name: 'consumerGroup',
                        pattern: 'string'
                    }, {
                        name: 'partitions',
                        pattern: 'arrayInt'
                    }]
                }, {
                    id: 'http',
                    name: 'HTTP',
                    maxWorkers: 'number',
                    attributes: [{
                        name: 'port',
                        pattern: 'number'
                    }]
                }, {
                    id: 'kinesis',
                    name: 'Kinesis',
                    attributes: [{
                        name: 'accessKeyID',
                        pattern: 'string'
                    }, {
                        name: 'secretAccessKey',
                        pattern: 'string'
                    }, {
                        name: 'regionName',
                        pattern: 'string'
                    }, {
                        name: 'streamName',
                        pattern: 'string'
                    }, {
                        name: 'shards',
                        pattern: 'arrayStr'
                    }]
                }],
                binding: [{
                    id: 'v3io',
                    name: 'V3io',
                    url: 'string',
                    attributes: [{
                        name: 'secret',
                        pattern: 'string'
                    }]
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
            return runtime === 'golang' ? 'main:Handler' : runtime === 'java' ? 'Handler' : 'main:handler';
        }

        /**
         * Actions for Action panel
         * @returns {Object[]} - array of actions
         */
        function initVersionActions() {
            var actions = [{
                label: 'Edit',
                id: 'edit',
                icon: 'igz-icon-edit',
                active: true
            }, {
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Are you sure you want to delete selected version?',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'critical_alert'
                }
            }];

            return actions;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    CreateFunctionController.$inject = ['$state', '$stateParams', 'lodash', 'DialogsService', 'NuclioHeaderService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclCreateFunction', {
        templateUrl: 'nuclio/projects/project/functions/create-function/create-function.tpl.html',
        controller: CreateFunctionController
    });

    function CreateFunctionController($state, $stateParams, lodash, DialogsService, NuclioHeaderService, NuclioProjectsDataService) {
        var ctrl = this;
        var selectedFunctionType = 'from_scratch';

        ctrl.isSplashShowed = {
            value: true
        };
        ctrl.project = {};
        ctrl.scrollConfig = {
            axis: 'yx',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

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
            NuclioProjectsDataService.getProject($stateParams.projectId).then(function (project) {
                ctrl.project = project;

                // breadcrumbs config
                var title = {
                    project: project.spec.displayName,
                    function: 'Create function'
                };

                NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
            }).catch(function (error) {
                DialogsService.alert('Could not retrieve project namespace');

                $state.go('app.projects');
            }).finally(function () {
                ctrl.isSplashShowed.value = false;
            });
        }

        //
        // Public methods
        //

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
    }
})();
'use strict';

(function () {
    'use strict';

    NclFunctionController.$inject = ['$state', '$timeout', 'ConfigService', 'HeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclFunction', {
        bindings: {},
        templateUrl: 'nuclio/projects/project/functions/function/ncl-function.tpl.html',
        controller: NclFunctionController
    });

    function NclFunctionController($state, $timeout, ConfigService, HeaderService) {
        var ctrl = this;
    }
})();
'use strict';

(function () {
    'use strict';

    NclFunctionCollapsingRowController.$inject = ['$state', 'lodash', 'NuclioFunctionsDataService', 'NuclioHeaderService'];
    angular.module('iguazio.dashboard-controls').component('nclFunctionCollapsingRow', {
        bindings: {
            function: '<',
            project: '<',
            actionHandlerCallback: '&'
        },
        templateUrl: 'nuclio/projects/project/functions/function-collapsing-row/function-collapsing-row.tpl.html',
        controller: NclFunctionCollapsingRowController
    });

    function NclFunctionCollapsingRowController($state, lodash, NuclioFunctionsDataService, NuclioHeaderService) {
        var ctrl = this;

        ctrl.actions = [];
        ctrl.isCollapsed = true;
        ctrl.title = {
            project: ctrl.project.spec.displayName,
            function: ctrl.function.metadata.name
        };

        ctrl.$onInit = onInit;

        ctrl.isFunctionShowed = isFunctionShowed;
        ctrl.handleAction = handleAction;
        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.function, {
                ui: {
                    delete: deleteFunction
                }
            });

            ctrl.actions = initActions();
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
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [{
                label: 'Delete',
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: 'Delete Function “' + ctrl.function.metadata.name + '”?',
                    description: 'Deleted function cannot be restored.',
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'nuclio_alert'
                }
            }];
        }

        /**
         * Deletes function from functions list
         * @returns {Promise}
         */
        function deleteFunction() {
            return NuclioFunctionsDataService.deleteFunction(ctrl.function.metadata);
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

            NuclioHeaderService.updateMainHeader('Projects', ctrl.title, $state.current.name);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    NclVersionController.$inject = ['$interval', '$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$q', 'lodash', 'ngDialog', 'ConfigService', 'DialogsService', 'NuclioEventService', 'NuclioHeaderService', 'NuclioFunctionsDataService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('nclVersion', {
        bindings: {
            project: '<',
            version: '<',
            onEditCallback: '&?'
        },
        templateUrl: 'nuclio/projects/project/functions/version/version.tpl.html',
        controller: NclVersionController
    });

    function NclVersionController($interval, $scope, $rootScope, $state, $stateParams, $timeout, $q, lodash, ngDialog, ConfigService, DialogsService, NuclioEventService, NuclioHeaderService, NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;
        var interval = null;

        ctrl.action = null;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isTestResultShown = false;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.selectedFunctionEvent = null;
        ctrl.functionEvents = [];
        ctrl.rowIsCollapsed = {
            statusCode: false,
            headers: false,
            body: false,
            deployBlock: false,
            deployBody: true
        };

        ctrl.$onInit = onInit;

        ctrl.deleteFunctionEvent = deleteFunctionEvent;
        ctrl.openFunctionEventDialog = openFunctionEventDialog;
        ctrl.deployVersion = deployVersion;
        ctrl.onSelectFunctionEvent = onSelectFunctionEvent;
        ctrl.getDeployStatusState = getDeployStatusState;
        ctrl.invokeFunction = invokeFunction;
        ctrl.toggleDeployResult = toggleDeployResult;
        ctrl.toggleTestResult = toggleTestResult;
        ctrl.onRowCollapse = onRowCollapse;
        ctrl.onSelectAction = onSelectAction;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            setDeployResult('ready');

            ctrl.isFunctionDeployed = !$stateParams.isNewFunction;
            ctrl.actions = [{
                id: 'deleteFunction',
                name: 'Delete function',
                dialog: {
                    message: {
                        message: 'Delete function “' + ctrl.version.metadata.name + '”?',
                        description: 'Deleted function cannot be restored.'
                    },
                    yesLabel: 'Yes, Delete',
                    noLabel: 'Cancel',
                    type: 'nuclio_alert'
                }
            }];

            ctrl.navigationTabsConfig = [{
                tabName: 'Code',
                uiRoute: 'app.project.function.edit.code'
            }, {
                tabName: 'Configuration',
                uiRoute: 'app.project.function.edit.configuration'
            }, {
                tabName: 'Trigger',
                uiRoute: 'app.project.function.edit.trigger'
            }];

            if (ctrl.isDemoMode()) {
                ctrl.navigationTabsConfig.push({
                    tabName: 'Monitoring',
                    uiRoute: 'app.project.function.edit.monitoring'
                });
            }
            ctrl.functionEvents = [];
            ctrl.selectedFunctionEvent = lodash.isEmpty(ctrl.functionEvents) ? null : ctrl.functionEvents[0];

            $q.all({
                project: NuclioProjectsDataService.getProject($stateParams.projectId),
                events: NuclioEventService.getEvents(ctrl.version)
            }).then(function (response) {

                // set projects data
                ctrl.project = response.project;

                // sets function events data
                convertTestEventsData(response.events.data);

                // breadcrumbs config
                var title = {
                    project: ctrl.project.spec.displayName,
                    function: $stateParams.functionId,
                    version: '$LATEST'
                };

                NuclioHeaderService.updateMainHeader('Projects', title, $state.current.name);
            }).catch(function () {
                DialogsService.alert('Oops: Unknown error occurred');
            });
        }

        //
        // Public methods
        //

        /**
         * Deletes selected event
         */
        function deleteFunctionEvent() {
            var dialogConfig = {
                message: {
                    message: 'Delete event “' + ctrl.selectedFunctionEvent.name + '”?',
                    description: 'Deleted event cannot be restored.'
                },
                yesLabel: 'Yes, Delete',
                noLabel: 'Cancel',
                type: 'nuclio_alert'
            };

            DialogsService.confirm(dialogConfig.message, dialogConfig.yesLabel, dialogConfig.noLabel, dialogConfig.type).then(function () {
                var eventData = {
                    metadata: {
                        name: ctrl.selectedFunctionEvent.eventData.metadata.name,
                        namespace: ctrl.selectedFunctionEvent.eventData.metadata.namespace
                    }
                };

                ctrl.isSplashShowed.value = true;

                NuclioEventService.deleteEvent(eventData).then(function () {

                    // update test events list
                    NuclioEventService.getEvents(ctrl.version).then(function (response) {
                        convertTestEventsData(response.data);

                        ctrl.isSplashShowed.value = false;
                    });
                }).catch(function () {
                    DialogsService.alert('Oops: Unknown error occurred while deleting event');

                    ctrl.isSplashShowed.value = false;
                });
            });
        }

        /**
         * Opens a function event dialog
         * @param {boolean} createEvent - if value 'false' then open dialog to edit exisitng event, otherwise open dialog
         * to create new event.
         */
        function openFunctionEventDialog(createEvent) {
            ngDialog.open({
                template: '<ncl-function-event-dialog data-create-event="ngDialogData.createEvent" ' + 'data-selected-event="ngDialogData.selectedEvent" data-version="ngDialogData.version" ' + 'data-close-dialog="closeThisDialog(isEventDeployed)"></ncl-test-event-dialog>',
                plain: true,
                scope: $scope,
                data: {
                    createEvent: createEvent,
                    selectedEvent: createEvent ? {} : lodash.get(ctrl.selectedFunctionEvent, 'eventData', {}),
                    version: ctrl.version
                },
                className: 'ngdialog-theme-iguazio settings-dialog-wrapper'
            }).closePromise.then(function (data) {

                // check if event was doployed or failed
                // if yes, then push newest crwated event to events drop-down
                if (data.value) {
                    ctrl.isSplashShowed.value = true;

                    // update test events list
                    NuclioEventService.getEvents(ctrl.version).then(function (response) {
                        convertTestEventsData(response.data);

                        ctrl.isSplashShowed.value = false;
                    });
                }
            });
        }

        /**
         * Deploys changed version
         */
        function deployVersion() {
            $rootScope.$broadcast('deploy-function-version');

            setDeployResult('building');

            if (!lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.version = lodash.omit(ctrl.version, 'status');

            ctrl.isDeployResultShown = true;
            ctrl.rowIsCollapsed.deployBlock = true;

            NuclioFunctionsDataService.updateFunction(ctrl.version, ctrl.project.metadata.name).then(pullFunctionState);
        }

        /**
         * Gets current status state
         * @param {string} state
         * @returns {string}
         */
        function getDeployStatusState(state) {
            return state === 'ready' ? 'Successfully deployed' : state === 'error' ? 'Failed to deploy' : state === 'building' ? 'Deploying...' : '';
        }

        /**
         * Called when a test event is selected
         * @param {Object} item - the new data
         */
        function onSelectFunctionEvent(item) {
            ctrl.selectedFunctionEvent = item;
        }

        /**
         * Calls version test
         */
        function invokeFunction() {
            if (!lodash.isNil(ctrl.selectedFunctionEvent)) {
                NuclioEventService.invokeFunction(ctrl.selectedFunctionEvent.eventData).then(function (response) {

                    // TODO
                    ctrl.testResult = response.data;
                }).catch(function () {

                    // TODO: replace with real data
                    lodash.defauldDeeps(ctrl.testResult, {
                        status: {
                            state: 'Succeeded',
                            code: 'Lorem'
                        },
                        headers: {
                            'Access-control-allow-origin': '*',
                            'Date': '2018-02-05T17:07:48.509Z',
                            'x-nuclio-logs': [],
                            'Server': 'nuclio',
                            'Content-Length': 5,
                            'Content-Type': 'text/plain; charset=utf-8'
                        },
                        body: {
                            'metadata': {
                                'name': 'name',
                                'namespace': 'nuclio'
                            }
                        }
                    });

                    ctrl.isTestResultShown = true;
                });
            }
        }

        /**
         * Shows/hides test version result
         */
        function toggleTestResult() {
            ctrl.isTestResultShown = !ctrl.isTestResultShown;

            $timeout(resizeVersionView);
        }

        /**
         * Shows/hides deploy version result
         */
        function toggleDeployResult() {
            ctrl.isDeployResultShown = !ctrl.isDeployResultShown;

            $timeout(resizeVersionView);
        }

        /**
         * Pulls function status.
         * Periodically sends request to get function's state, until state will not be 'ready' or 'error'
         */
        function pullFunctionState() {
            interval = $interval(function () {
                NuclioFunctionsDataService.getFunction(ctrl.version.metadata, ctrl.project.metadata.name).then(function (response) {
                    if (response.status.state === 'ready' || response.status.state === 'error') {
                        if (!lodash.isNil(interval)) {
                            $interval.cancel(interval);
                            interval = null;
                        }
                    }

                    ctrl.isFunctionDeployed = true;
                    ctrl.deployResult = response;
                }).catch(function (error) {
                    if (error.status !== 404) {
                        if (!lodash.isNil(interval)) {
                            $interval.cancel(interval);
                            interval = null;
                        }

                        ctrl.isSplashShowed.value = false;
                    }
                });
            }, 2000);
        }

        /**
         * Called when row is collapsed/expanded
         * @param {string} row - name of expanded/collapsed row
         */
        function onRowCollapse(row) {
            ctrl.rowIsCollapsed[row] = !ctrl.rowIsCollapsed[row];

            if (!ctrl.rowIsCollapsed[row] && row === 'deployBlock') {
                ctrl.rowIsCollapsed.deployBody = false;
            }

            $timeout(resizeVersionView);
        }

        /**
         * Called when action is selected
         * @param {Object} item - selected action
         */
        function onSelectAction(item) {
            ctrl.action = item.id;

            if (item.id === 'deleteFunction') {
                DialogsService.confirm(item.dialog.message, item.dialog.yesLabel, item.dialog.noLabel, item.dialog.type).then(function () {
                    ctrl.isSplashShowed.value = true;

                    NuclioFunctionsDataService.deleteFunction(ctrl.version.metadata).then(function () {
                        $state.go('app.project.functions');
                    });
                }).catch(function () {
                    ctrl.action = ctrl.actions[0].id;
                });
            }
        }

        //
        // Private methods
        //

        /**
         * Resize view after test result is closed
         */
        function resizeVersionView() {
            var clientHeight = document.documentElement.clientHeight;
            var headerBottom = angular.element(document).find('.ncl-navigation-tabs')[0];
            var contentView = angular.element(document).find('.ncl-edit-version-view')[0];
            var contentBlock = angular.element(document).find('.ncl-version')[0];
            var headerRect = headerBottom.getBoundingClientRect();
            var contentBlockRect = contentBlock.getBoundingClientRect();
            var contentHeight = clientHeight - headerRect.bottom;
            var contentBlockHeight = contentBlockRect.bottom - contentBlockRect.top;

            contentView = angular.element(contentView);
            contentBlock = angular.element(contentBlock);

            if (contentBlockHeight < contentHeight) {
                contentView.css({ 'height': contentHeight + 'px' });
                contentBlock.css({ 'height': contentHeight + 'px' });
            }
        }

        /**
         * Converts event to structure that needed for drop-down
         * @param {Array} events -  array of events
         */
        function convertTestEventsData(events) {
            ctrl.functionEvents = lodash.map(events, function (event) {
                return {
                    id: event.metadata.name,
                    name: event.spec.displayName,
                    eventData: event
                };
            });

            ctrl.selectedFunctionEvent = ctrl.functionEvents[0];
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
    '<section class="igz-general-content" data-igz-extend-background><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><igz-info-page-actions-bar class="igz-component"><div class="actions-bar-left"><igz-action-panel data-actions="$ctrl.actions"></igz-action-panel></div><div class="actions-bar-right"><div class="actions-bar-left actions-buttons-block"><button class="ncl-new-entity-button" data-ng-click="$ctrl.openNewProjectDialog()" data-tooltip="Create a project" data-tooltip-placement="bottom" data-tooltip-append-to-body="true" data-tooltip-popup-delay="100" data-tooltip-class="custom-tooltip">Create project</button></div><div class="actions-bar-left actions-content-block"><div class="igz-action-panel"><div class="actions-list"><igz-action-item-refresh data-refresh="$ctrl.refreshProjects()"></igz-action-item-refresh><igz-sort-dropdown class="igz-component pull-left" data-sort-options="$ctrl.sortOptions" data-reverse-sorting="$ctrl.isReverseSorting" data-update-data-callback="$ctrl.onSortOptionsChange" data-tooltip="Sort" data-tooltip-append-to-body="true" data-tooltip-placement="top"></igz-sort-dropdown></div></div></div><igz-actions-panes data-filters-toggle-method="$ctrl.toggleFilters()" data-show-filter-icon="true" data-filters-counter="$ctrl.filtersCounter"></igz-actions-panes></div></igz-info-page-actions-bar><igz-info-page-content class="igz-component"><div id="nuclio-projects-page" class="projects nuclio-projects-page"><div class="nuclio-table common-table"><div class="common-table-header"><igz-action-checkbox-all class="common-table-cell check-all-rows" data-items-count="$ctrl.projects.length"></igz-action-checkbox-all><div class="igz-row common-table-cells-container"><div class="igz-col-25 common-table-cell sortable name" data-ng-class="$ctrl.isColumnSorted(\'displayName\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'displayName\')">Name<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.name"></div></div><div class="igz-col-25 common-table-cell sortable description" data-ng-class="$ctrl.isColumnSorted(\'description\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'description\')">Description<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.description"></div></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell sortable created-by" data-ng-class="$ctrl.isColumnSorted(\'created_by\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'created_by\')">Created by<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.created-by"></div></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell sortable created-date" data-ng-class="$ctrl.isColumnSorted(\'created_date\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'created_date\')">Created date<span class="sort-arrow"></span><div data-igz-resizable-table-column data-col-class="common-table-cell.created-date"></div></div></div><div class="common-table-cell actions-menu"></div></div><div class="search-input-not-found" data-ng-if="$ctrl.isProjectsListEmpty()">There are currently no projects, you can create a project by clicking the ‘Create Project’ button</div><div data-igz-extend-background class="common-table-body"><div class="igz-scrollable-container" data-ng-scrollbars data-ng-hide="$ctrl.searchStates.searchNotFound && $ctrl.searchStates.searchInProgress"><div data-ng-repeat="project in $ctrl.projects"><div data-igz-show-hide-search-item="project"><ncl-projects-table-row data-igz-resizable-row-cells data-project="project" data-projects-list="$ctrl.projects" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItems)"></ncl-projects-table-row></div></div></div></div></div></div></igz-info-page-content><igz-info-page-filters data-is-filters-showed="$ctrl.isFiltersShowed.value" data-apply-filters="$ctrl.onApplyFilters(false)" data-reset-filters="$ctrl.onResetFilters(false)" data-change-state-callback="$ctrl.isFiltersShowed.changeValue(newVal)" data-toggle-method="$ctrl.toggleFilters()"><igz-search-input class="info-page-filters-item igz-component" data-data-set="$ctrl.projects" data-search-keys="$ctrl.searchKeys" data-search-callback="$ctrl.onUpdateFiltersCounter(searchQuery)" data-placeholder="Search projects..." data-live-search="false" data-search-states="$ctrl.searchStates"></igz-search-input></igz-info-page-filters></section>');
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
  $templateCache.put('igz_controls/components/action-item/action-item.tpl.html',
    '<div class="igz-action-item" data-ng-class="{\'inactive\': !$ctrl.action.active,\n' +
    '     \'subtemplate-show\': $ctrl.action.subTemplateProps.isShown,\n' +
    '     \'ng-hide\': !$ctrl.isItemVisible($ctrl.action),\n' +
    '     \'divider\': $ctrl.action.id === \'divider\'}" data-ng-click="$ctrl.onClickAction($event)" data-ng-if="$ctrl.template !== \'additional\'"><div data-tooltip="{{$ctrl.action.label}}" data-tooltip-popup-delay="1000" data-tooltip-placement="bottom"><div data-ng-if="$ctrl.action.id === \'upload\'" data-ngf-select data-ngf-multiple="true" data-ngf-change="$ctrl.onFilesDropped($files)"><div class="action-icon {{$ctrl.action.icon}}"></div><div class="action-label">{{$ctrl.action.label}}</div></div><div data-ng-if="$ctrl.action.id !== \'upload\'"><div class="action-icon {{$ctrl.action.icon}}" data-ng-style="$ctrl.action.iconColor && {\'color\': $ctrl.action.iconColor}"></div><div class="action-label">{{$ctrl.action.label}}</div><igz-action-item-subtemplate class="action-subtemplate igz-component" data-ng-if="$ctrl.action.template" data-ng-show="$ctrl.action.subTemplateProps.isShown" action="$ctrl.action" data-ng-click="$event.stopPropagation()"></igz-action-item-subtemplate></div></div></div><li data-ng-if="$ctrl.template === \'additional\'" data-ng-click="$ctrl.onClickAction($event)"><div class="action-icon {{$ctrl.action.icon}}" data-ng-style="$ctrl.action.iconColor && {\'color\': $ctrl.action.iconColor}"></div><div class="action-label">{{$ctrl.action.label}}</div><igz-action-item-subtemplate class="action-subtemplate igz-component" data-ng-if="$ctrl.action.template" data-ng-show="$ctrl.action.subTemplateProps.isShown" action="$ctrl.action" data-ng-click="$event.stopPropagation()"></igz-action-item-subtemplate></li>');
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
    '<div class="igz-action-menu" data-ng-if="$ctrl.isVisible()"><div class="menu-button {{$ctrl.iconClass}}" data-ng-class="{active: $ctrl.isMenuShown}" data-ng-click="$ctrl.toggleMenu($event)"></div><div class="menu-dropdown" data-ng-if="$ctrl.isMenuShown"><div class="actions-list" data-ng-click="$ctrl.toggleMenu($event)"><igz-action-item data-ng-repeat="action in $ctrl.actions" data-action="action"></igz-action-item></div><div class="shortcuts-list" data-ng-if="$ctrl.shortcuts && $ctrl.shortcuts.length > 0" data-ng-class="{\'first-block\': $ctrl.actions.length === 0}"><div class="shortcuts-header">Shortcuts</div><div class="shortcuts-item" data-ng-repeat="shortcut in $ctrl.shortcuts" data-ng-click="$ctrl.showDetails($event, shortcut.state)">{{shortcut.label}}</div></div></div></div>');
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
    '<div class="igz-action-panel" data-igz-right-click data-ng-show="$ctrl.isActionPanelShown()"><div class="actions-list clearfix" data-ng-show="$ctrl.mainActions.length > 0 || $ctrl.remainingActions.length > 0"><igz-action-item data-ng-repeat="action in $ctrl.mainActions" data-action="action"></igz-action-item><igz-action-item-more data-ng-if="$ctrl.remainingActions.length !== 0" data-actions="$ctrl.remainingActions"><div class="transclude-container" data-ng-transclude></div></igz-action-item-more></div><div class="actions-list empty" data-ng-show="$ctrl.mainActions.length === 0 && $ctrl.remainingActions.length === 0">(No actions)</div></div>');
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
    '<div class="actions-bar-left actions-panes-block"><div class="igz-action-panel"><div class="actions-list"><div class="igz-action-item" data-ng-if="$ctrl.isShowFilterActionIcon()" data-tooltip="Filter" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.filtersToggleMethod()"><div class="action-icon igz-icon-filter"></div><span data-ng-if="$ctrl.filtersCounter" class="filter-counter">{{$ctrl.filtersCounter}}</span></div><div class="igz-action-item last-item" data-ng-class="{inactive: (!$ctrl.isInfoPaneOpened && !$ctrl.infoPaneToggleMethod) || $ctrl.infoPaneDisable}" data-ng-if="$ctrl.closeInfoPane || $ctrl.infoPaneToggleMethod" data-tooltip="Info pane" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.callToggleMethod()"><div class="action-icon igz-icon-info-round"></div></div></div></div></div>');
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
    '                     \'dropdown-input-disabled\': $ctrl.isDisabled,\n' +
    '                     \'dropdown-input-opened\': $ctrl.isDropdownContainerShown}"><div class="default-dropdown-field" tabindex="0" data-ng-click="$ctrl.readOnly || $ctrl.toggleDropdown($event)" data-ng-keydown="$ctrl.onDropDownKeydown($event)" data-tooltip="{{$ctrl.isDropdownContainerShown ? \'\' : $ctrl.typedValue}}" data-tooltip-append-to-body="true" data-tooltip-placement="top" data-tooltip-popup-delay="300" data-ng-class="{placeholder: $ctrl.isPlaceholderClass(),\n' +
    '                         disabled: $ctrl.isDisabled,\n' +
    '                         readonly: $ctrl.readOnly}"><div class="dropdown-selected-item"><div data-ng-if="$ctrl.showSelectedItem().icon.name" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'priority\'}" class="dropdown-icon {{$ctrl.getIcon($ctrl.showSelectedItem()).name}}"></div><div data-ng-if="$ctrl.showSelectedItem().badge" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'badges-dropdown\'}" class="{{$ctrl.showSelectedItem().badge.class}}">{{$ctrl.showSelectedItem().badge.value}}</div><input type="text" class="input-name text-ellipsis" data-ng-class="{\'non-editable\': !$ctrl.enableTyping && !$ctrl.isDisabled, capitalized: $ctrl.isCapitalized}" data-ng-model="$ctrl.typedValue" data-ng-change="$ctrl.onChangeTypingInput()" data-ng-readonly="!$ctrl.enableTyping" data-ng-required="$ctrl.checkIsRequired()" data-ng-disabled="$ctrl.isDisabled || !$ctrl.enableTyping" data-ng-pattern="$ctrl.matchPattern" name="{{$ctrl.inputName}}" placeholder="{{$ctrl.placeholder}}"><span data-ng-if="$ctrl.getDescription($ctrl.showSelectedItem().description)" class="description">{{$ctrl.getDescription($ctrl.showSelectedItem().description)}}</span></div><div class="dropdown-arrow" data-ng-if="!$ctrl.readOnly"><span class="igz-icon-dropdown" data-ng-class="{\'rotate-arrow\': $ctrl.isDropUp}"></span></div></div><div class="default-dropdown-container" tabindex="-1" data-ng-if="$ctrl.isDropdownContainerShown" data-ng-style="{\'top\': $ctrl.topPosition}" data-ng-scrollbars><ul class="list" tabindex="-1"><li class="list-item" tabindex="0" data-ng-repeat="item in $ctrl.getValuesArray() track by $index" data-ng-click="$ctrl.selectItem(item)" data-ng-keydown="$ctrl.onItemKeydown($event, item)" data-ng-class="{\'list-item-description\': $ctrl.getDescription(item)}" data-ng-show="item.visible" data-tooltip="{{$ctrl.getTooltip(item)}}" data-tooltip-placement="left" data-tooltip-append-to-body="true"><div class="list-item-block"><div data-ng-if="$ctrl.getIcon(item).name" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'priority\'}" class="dropdown-icon {{$ctrl.getIcon(item).name}}"></div><div data-ng-if="item.badge" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'badges-dropdown\'}" class="{{item.badge.class}}">{{item.badge.value}}</div><div class="list-item-label"><span class="list-item-name" data-ng-class="{\'capitalized\': $ctrl.isCapitalized}">{{$ctrl.getName(item)}}</span><span data-ng-show="$ctrl.getDescription(item)" class="description">{{$ctrl.getDescription(item)}}</span></div></div><div class="igz-col-20 igz-icon-tick selected-item-icon" data-ng-show="$ctrl.isItemSelected(item) && !$ctrl.isPagination"></div></li></ul><div class="add-button-wrapper" tabindex="0" data-ng-if="$ctrl.bottomButtonCallback"><a href="#" class="add-button" data-ng-click="$ctrl.bottomButtonCallback()">{{ $ctrl.bottomButtonText }}</a></div><div class="transclude-container align-items-center" data-ng-if="$ctrl.isTranscludePassed" data-ng-transclude></div></div></div>');
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
    '<div class="number-input" data-ng-class="[{\'invalid\': $ctrl.checkInvalidation()},\n' +
    '                    {\'pristine\': !$ctrl.numberInputChanged},\n' +
    '                    {\'disabled\': $ctrl.isDisabled}]"><div class="additional-left-block"><span class="prefix-unit" data-ng-show="$ctrl.isShownUnit($ctrl.prefixUnit)">{{$ctrl.prefixUnit}}</span></div><input class="input-field additional-right-padding field" data-ng-class="{\'additional-left-padding\': $ctrl.isShownUnit($ctrl.prefixUnit)}" type="text" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.currentValue" data-ng-model-options="{allowInvalid: true}" data-money min="{{$ctrl.minValue}}" max="{{$ctrl.maxValue}}" placeholder="{{$ctrl.placeholder}}" data-precision="{{$ctrl.precision}}" data-ng-focus="$ctrl.inputFocused=true" data-ng-blur="$ctrl.onBlurInput()" data-ng-change="$ctrl.onChangeInput()" data-ng-disabled="$ctrl.isDisabled" data-igz-validate-elevation data-compare-val="$ctrl.validationValue" data-compare-val-unit="$ctrl.validationValueUnit.power" data-current-val-unit="$ctrl.currentValueUnit.power"><span class="suffix-unit" data-ng-show="$ctrl.isShownUnit($ctrl.suffixUnit)">{{$ctrl.suffixUnit}}</span><div class="arrow-block"><span class="igz-icon-dropup" data-ng-click="$ctrl.isDisabled || $ctrl.increaseValue()"></span><span class="igz-icon-dropdown" data-ng-click="$ctrl.isDisabled || $ctrl.decreaseValue()"></span></div></div>');
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
    '<div data-ng-class="{\'search-input\': $ctrl.searchType === \'infoPage\', \'search-input-actions-bar\': $ctrl.searchType === \'actionsBar\'}"><input type="text" class="container-search-input" placeholder="{{$ctrl.placeholder}}" data-ng-keydown="$ctrl.onPressEnter($event)" data-igz-input-blur-on-enter data-ng-model="$ctrl.searchQuery" data-ng-model-options="{ debounce: { \'default\': 500, \'blur\': 0 } }"><span class="igz-icon-search"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.searchQuery" data-ng-click="$ctrl.clearInputField()"></span></div>');
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
    '<div class="igz-slider-input-block clearfix"><div class="igz-slider-input-title igz-col-50"><div class="igz-slider-input-title-text"><i data-ng-if="$ctrl.sliderConfig.iconType" data-ng-class="($ctrl.sliderConfig.iconType | lowercase)"></i>{{$ctrl.sliderConfig.name}}&nbsp;<i data-ng-if="$ctrl.sliderConfig.labelHelpIcon" class="igz-icon-help-round"></i></div></div><div class="igz-col-16"></div><div class="igz-slider-input-current-value igz-col-18"><div class="igz-slider-input-current-value-text">{{$ctrl.sliderConfig.valueLabel}}</div></div><div class="igz-slider-input-units-dropdown igz-col-16" data-ng-if="$ctrl.measureUnits"><igz-default-dropdown data-values-array="$ctrl.measureUnits" data-selected-item="$ctrl.selectedItem" data-item-select-callback="$ctrl.changeTrafficUnit(item)"></igz-default-dropdown></div><div class="igz-slider-input-rz-slider igz-col-100"><rzslider class="rzslider" data-rz-slider-model="$ctrl.sliderConfig.value" data-rz-slider-options="$ctrl.sliderConfig.options"></rzslider></div></div>');
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
    '<div class="igz-browser-sort-dropdown dropdown" data-dropdown data-is-open="$ctrl.isOpen"><div class="igz-action-item" data-dropdown-toggle><span class="action-icon igz-icon-sort"></span></div><ul class="dropdown-menu dropdown-list" data-ng-if="$ctrl.isOpen"><li class="dropdown-menu-item" data-ng-repeat="option in $ctrl.sortOptions" data-ng-click="$ctrl.toggleSortingOrder(option)"><span class="item-name" data-ng-class="$ctrl.getItemClass(option.active)">{{option.label}}</span><span class="igz-icon-sort-{{$ctrl.reverseSorting ? \'down\' : \'up\'}}" data-ng-show="option.active"></span></li></ul></div>');
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
    '<div class="splash-screen" data-ng-hide="!$ctrl.isSplashShowed.value"><div class="loading-splash-screen" data-ng-if="$ctrl.isLoading"><div class="splash-logo-wrapper"><div class="loader-fading-circle"><div class="loader-circle1 loader-circle"></div><div class="loader-circle2 loader-circle"></div><div class="loader-circle3 loader-circle"></div><div class="loader-circle4 loader-circle"></div><div class="loader-circle5 loader-circle"></div><div class="loader-circle6 loader-circle"></div><div class="loader-circle7 loader-circle"></div><div class="loader-circle8 loader-circle"></div><div class="loader-circle9 loader-circle"></div><div class="loader-circle10 loader-circle"></div><div class="loader-circle11 loader-circle"></div><div class="loader-circle12 loader-circle"></div></div></div><div class="loading-text">{{$ctrl.textToDisplay}}</div></div><div class="alert-splash-screen" data-ng-if="$ctrl.isAlertShowing"><div class="header"></div><div class="notification-text">{{$ctrl.alertText}}</div><div class="buttons"><div class="refresh-button" data-ng-click="$ctrl.refreshPage()"><span class="igz-icon-refresh"></span>Refresh</div></div></div></div>');
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
    '<div class="validating-input-field" data-ng-class="{\'focused\': $ctrl.inputFocused, \'with-counter\': $ctrl.validationMaxLength && $ctrl.isCounterVisible()}"><div data-ng-if="$ctrl.fieldType === \'input\'"><div class="input-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="!$ctrl.onlyValidCharacters || $ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="input-placeholder" data-ng-class="{\'with-icon\': $ctrl.inputIcon}">{{$ctrl.placeholderText}}</div><input class="input-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid(),\n' +
    '                               \'with-icon\': $ctrl.inputIcon}" name="{{$ctrl.inputName}}" data-ng-readonly="$ctrl.readOnly" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-ng-disabled="$ctrl.isDisabled" data-ng-keydown="$ctrl.keyDown($event)" data-igz-input-only-valid-characters="$ctrl.validationPattern" data-only-valid-characters="{{$ctrl.onlyValidCharacters}}" spellcheck="{{$ctrl.spellcheck}}" maxlength="{{$ctrl.onlyValidCharacters ? $ctrl.validationMaxLength : null}}" data-igz-input-blur-on-enter><span data-ng-if="$ctrl.inputIcon" class="input-icon {{$ctrl.inputIcon}}"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.data && $ctrl.isClearIcon" data-ng-click="$ctrl.clearInputField()"></span></div><div data-ng-if="$ctrl.fieldType === \'textarea\'"><div class="textarea-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="!$ctrl.onlyValidCharacters || $ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="textarea-placeholder">{{$ctrl.placeholderText}}</div><textarea class="textarea-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid()}" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.data" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" spellcheck="{{$ctrl.spellcheck}}"></textarea></div><div data-ng-if="$ctrl.fieldType === \'password\'"><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="input-placeholder">{{$ctrl.placeholderText}}</div><input class="input-field field" tabindex="0" data-igz-validate-password-confirmation="$ctrl.compareInputValue" type="password" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-igz-input-blur-on-enter></div></div>');
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
    '<div class="close-button igz-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>Edit Project</span></div><div class="main-content"><form name="editProjectForm" novalidate data-ng-keydown="$ctrl.saveProject($event)"><div class="field-group"><div class="field-label">Project Name</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(editProjectForm, \'spec.displayName\')">The inputs you provided are invalid or incorrect</div><div class="error" data-ng-show="$ctrl.nameTakenError">Name already exists</div><igz-validating-input-field data-field-type="input" data-input-name="spec.displayName" data-input-value="$ctrl.data.spec.displayName" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-is-focused="true" data-validation-is-required="true" data-validation-pattern="$ctrl.nameValidationPattern" data-form-object="editProjectForm" data-placeholder-text="Project name..."></igz-validating-input-field></div></div><div class="field-group"><div class="field-label">Description</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(editProjectForm, \'description\')">The inputs you provided are invalid or incorrect</div><igz-validating-input-field data-field-type="input" data-input-name="spec.description" data-input-value="$ctrl.data.spec.description" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-form-object="editProjectForm" data-placeholder-text="Description..."></igz-validating-input-field></div></div></form></div><div class="buttons"><div class="ncl-secondary-button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">Cancel</div><div class="ncl-primary-button" tabindex="0" data-ng-click="$ctrl.saveProject()" data-ng-keydown="$ctrl.saveProject($event)" data-ng-hide="$ctrl.isLoadingState">Apply</div><div class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">Loading...</div></div><div class="error-text text-centered error-relative" data-ng-show="$ctrl.isServerError()">Error: {{$ctrl.serverError}}</div>');
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
    '<div class="close-button igz-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>New Project</span></div><div class="main-content"><form name="newProjectForm" novalidate data-ng-keydown="$ctrl.createProject($event)"><div class="field-group"><div class="field-label">Project Name</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(newProjectForm, \'spec.displayName\')">The inputs you provided are invalid or incorrect</div><div class="error" data-ng-show="$ctrl.nameTakenError">Name already exists</div><igz-validating-input-field data-field-type="input" data-input-name="spec.displayName" data-input-value="$ctrl.data.spec.displayName" data-is-focused="true" data-form-object="newProjectForm" data-validation-is-required="true" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-validation-pattern="$ctrl.nameValidationPattern" data-placeholder-text="Type project name..."></igz-validating-input-field></div></div><div class="field-group"><div class="field-label">Description</div><div class="field-input"><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState(newProjectForm, \'spec.description\')">The inputs you provided are invalid or incorrect</div><igz-validating-input-field data-field-type="input" data-input-name="spec.description" data-input-value="$ctrl.data.spec.description" data-form-object="newProjectForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-placeholder-text="Type description..."></igz-validating-input-field></div></div></form></div><div class="buttons"><div class="ncl-secondary-button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">Cancel</div><div class="ncl-primary-button" tabindex="0" data-ng-click="$ctrl.createProject()" data-ng-keydown="$ctrl.createProject($event)" data-ng-hide="$ctrl.isLoadingState">Create</div><div class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">Loading...</div></div><div class="error-text text-centered error-relative" data-ng-show="$ctrl.isServerError()">Error: {{$ctrl.serverError}}</div>');
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
    '<div class="ncl-projects-table-row common-table-row"><div class="common-table-cell check-row"><igz-action-checkbox data-item="$ctrl.project"></igz-action-checkbox></div><div class="igz-row common-table-cells-container inactive-state" data-ng-click="$ctrl.showDetails($event)"><div class="igz-col-25 common-table-cell name">{{$ctrl.project.spec.displayName}}</div><div class="igz-col-25 common-table-cell description">{{$ctrl.project.spec.description}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell created-by">{{$ctrl.project.spec.created_by}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-25 common-table-cell created-date">{{$ctrl.project.spec.created_date | date: \'MMM dd, yyyy\'}}</div></div><div class="common-table-cell actions-menu"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div></div>');
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
    '<div class="projects-welcome-page"><div class="create-new-project"><div class="header">Get started with your project.</div><div class="description">Write from scratch or use an example repository to build an event driven application project.</div><div class="welcome-icon"><div class="ellipse"><div class="shape"></div><div class="shape-shadow"></div></div></div><div class="ncl-new-entity-button" data-ng-click="$ctrl.openNewProjectDialog()">Create project</div></div></div>');
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
    '<div class="igz-action-item" data-ng-class="{\'subtemplate-show\': $ctrl.isDropdownShown}"><div data-tooltip="More options" data-tooltip-popup-delay="1000" data-tooltip-placement="bottom"><div class="action-icon igz-icon-context-menu" data-ng-click="$ctrl.toggleTemplate()"></div></div><div class="item-dropdown-menu igz-component" data-ng-show="$ctrl.isDropdownShown"><ul class="item-dropdown-menu-list"><igz-action-item data-ng-repeat="action in $ctrl.actions" data-action="action" data-on-files-dropped="$ctrl.onFilesDropped" data-template="additional" data-ng-click="action.template ? \'\' : $ctrl.toggleTemplate()"></igz-action-item></ul><div class="transclude-container" data-ng-transclude></div></div></div>');
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
    '<div class="igz-action-item" data-tooltip="Refresh" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.refresh()"><div class="action-icon igz-icon-refresh"></div></div>');
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
    '<div class="info-page-filters-wrapper"><div class="info-page-filters" data-ng-show="$ctrl.isFiltersShowed" data-ng-keyup="$ctrl.onApplyFilters($event)"><div class="info-page-filters-title">Filter</div><div class="close-button igz-icon-close" data-ng-click="$ctrl.changeStateCallback({newVal: false})" data-ng-show="$ctrl.changeStateCallback"></div><div class="info-page-filters-body" data-ng-class="{\'buttons-shown\' : $ctrl.isShowFooterButtons()}" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollbarConfig"><div data-ng-transclude></div></div><div class="info-page-filters-footer" data-ng-if="$ctrl.isShowFooterButtons()"><button class="igz-button-just-text" tabindex="0" data-ng-click="$ctrl.onResetFilters()" data-ng-keydown="$ctrl.onResetFilters($event)" data-ng-if="$ctrl.resetFilters">Reset</button><button class="igz-button-primary" tabindex="0" data-ng-click="$ctrl.onApplyFilters()" data-ng-keydown="$ctrl.onApplyFilters($event)" data-ng-if="$ctrl.applyFilters">Apply</button></div></div></div>');
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
    '<span class="main-header-title" data-ng-click="$ctrl.goToProjectsList()" data-ng-class="{\'disable-behavior\': !$ctrl.mainHeaderTitle.project}">{{$ctrl.mainHeaderTitle.title}}</span><span class="ncl-header-subtitle" data-ng-if="$ctrl.mainHeaderTitle.project && !$ctrl.mainHeaderTitle.function"><span class="igz-icon-right"></span><ncl-breadcrumbs-dropdown data-state="$ctrl.mainHeaderTitle.state" data-title="$ctrl.mainHeaderTitle.project" class="ncl-bold-subtitle"></ncl-breadcrumbs-dropdown></span><span class="ncl-header-subtitle" data-ng-if="$ctrl.mainHeaderTitle.project && $ctrl.mainHeaderTitle.function"><span class="igz-icon-right"></span>{{$ctrl.mainHeaderTitle.project}}</span><span class="ncl-header-subtitle" data-ng-click="$ctrl.goToFunctionsList()" data-ng-if="$ctrl.mainHeaderTitle.function"><span class="igz-icon-right"></span><span class="main-header-title">Functions</span></span><span class="ncl-header-subtitle" data-ng-if="$ctrl.mainHeaderTitle.function"><span class="igz-icon-right"></span><span data-ng-class="{\'ncl-bold-subtitle\': $ctrl.mainHeaderTitle && !$ctrl.mainHeaderTitle.version}">{{$ctrl.mainHeaderTitle.function}}</span></span><span class="ncl-header-subtitle" data-ng-if="$ctrl.mainHeaderTitle.version"><span class="igz-icon-right"></span><ncl-breadcrumbs-dropdown data-state="$ctrl.mainHeaderTitle.state" data-title="$ctrl.mainHeaderTitle.version" class="ncl-bold-subtitle"></ncl-breadcrumbs-dropdown></span>');
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
    '<div class="ncl-breadcrumbs-dropdown dropdown" data-ng-class="{\'open\': $ctrl.showDropdownList}"><span class="breadcrumb-toggle" data-ng-click="$ctrl.showDropdown()">{{$ctrl.title}}<span class="igz-icon-dropdown"></span></span><div class="dropdown-menu"><div class="search-input"><input type="text" placeholder="{{$ctrl.placeholder}}" data-ng-model="$ctrl.searchText"><span class="igz-icon-search"></span></div><ul class="dropdown-list" data-ng-scrollbars><li data-ng-repeat="item in $ctrl.itemsList | filter: $ctrl.searchText"><a class="item-name" data-ng-click="$ctrl.showDetails($event, item)">{{item.name}}</a><span class="igz-icon-tick" data-ng-show="$ctrl.title === item.name"></span></li></ul></div></div>');
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
    '<div class="ncl-edit-item" data-ng-keydown="$ctrl.onSubmitForm($event)"><form name="$ctrl.editItemForm" novalidate autocomplete="off"><div class="igz-row title-field-row"><div class="igz-col-20 name-field"><igz-validating-input-field data-field-type="input" data-input-name="itemName" data-input-value="$ctrl.item.name" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="Type name..." data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="name"></igz-validating-input-field><div class="error" data-ng-show="$ctrl.isShowFieldInvalidState($ctrl.editItemForm, \'itemName\')">The inputs you provided are invalid or incorrect</div></div><div class="igz-col-12-5 class-field"><igz-default-dropdown data-select-property-only="id" data-placeholder="Select class..." data-values-array="$ctrl.classList" data-selected-item="$ctrl.item.kind" data-item-select-callback="$ctrl.onSelectClass(item)"></igz-default-dropdown></div><div class="igz-col-65"></div></div><div class="igz-row"><div class="igz-col-100 no-class-selected" data-ng-if="!$ctrl.isClassSelected()">Please select a class</div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.url)"><div class="field-label">URL</div><igz-validating-input-field data-field-type="input" data-input-name="itemURL" data-input-value="$ctrl.item.url" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-is-required="true" data-placeholder-text="Type URL..." data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="url"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected() && !$ctrl.isNil($ctrl.item.maxWorkers)"><div class="field-label">Max workers</div><igz-validating-input-field data-field-type="input" data-input-name="itemMaxWorkers" data-input-value="$ctrl.item.maxWorkers" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.numberValidationPattern" data-validation-is-required="true" data-placeholder-text="Type max workers..." data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="maxWorkers"></igz-validating-input-field></div><div class="igz-col-45 attribute-field" data-ng-if="$ctrl.isClassSelected()" data-ng-repeat="attribute in $ctrl.selectedClass.attributes"><div class="field-label">{{attribute.name}}</div><igz-validating-input-field data-field-type="input" data-input-name="item_{{attribute.name}}" data-input-value="$ctrl.getAttrValue(attribute.name)" data-is-focused="false" data-form-object="$ctrl.editItemForm" data-validation-pattern="$ctrl.getValidationPattern(attribute.pattern)" data-validation-is-required="true" data-placeholder-text="Type {{attribute.name}}..." data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="attributes.{{attribute.name}}"></igz-validating-input-field></div></div></form></div>');
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
    '<div class="ncl-key-value-input"><form name="$ctrl.keyValueInputForm" class="input-wrapper"><igz-validating-input-field class="input-key" data-ng-class="{\'use-type\': $ctrl.useType}" data-field-type="input" data-read-only="!$ctrl.editMode" data-is-focused="$ctrl.editMode" data-input-name="key" data-input-value="$ctrl.data.name" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="name" data-form-object="$ctrl.keyValueInputForm" data-validation-is-required="true" data-placeholder-text="Type key"></igz-validating-input-field><igz-default-dropdown class="input-type" data-ng-if="$ctrl.useType" data-read-only="!$ctrl.editMode" data-form-object="$ctrl.keyValueInputForm" data-select-property-only="id" data-prevent-drop-up="true" data-input-name="type" data-values-array="$ctrl.typesList" data-selected-item="$ctrl.getType()" data-placeholder="Select type..." data-item-select-callback="$ctrl.onTypeChanged(item, isItemChanged)" data-on-open-dropdown="$ctrl.openDropdown" data-on-close-dropdown="$ctrl.closeDropdown()"></igz-default-dropdown><igz-validating-input-field class="input-value" data-ng-class="{\'use-type\': $ctrl.useType}" data-field-type="input" data-read-only="!$ctrl.editMode" data-input-name="value" data-input-value="$ctrl.getInputValue()" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="value" data-form-object="$ctrl.keyValueInputForm" data-validation-is-required="true" data-placeholder-text="Type value..."></igz-validating-input-field><div class="three-dot-menu"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction" data-list-class="$ctrl.listClass"></igz-action-menu></div></form></div>');
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
    '<div class="ncl-collapsing-row"><div class="title-block common-table-row" data-ng-class="{\'collapsed\': !$ctrl.item.ui.expanded}"><div class="common-table-cell row-collapse"><span class="collapse-icon" data-ng-click="$ctrl.onCollapse()" data-ng-class="{\'collapsed igz-icon-right\': !$ctrl.item.ui.expanded, \'igz-icon-down\': $ctrl.item.ui.expanded}"></span></div><div data-ng-show="!$ctrl.item.ui.editModeActive" class="igz-row common-table-cells-container item-row"><div class="item-name">{{$ctrl.item.name}}</div><div class="item-class">{{$ctrl.item.kind}}</div><div class="igz-col-70 item-info"><div data-ng-hide="$ctrl.item.ui.expanded" class="collapsed-item-info-block"><span data-ng-repeat="(key, value) in $ctrl.item.attributes"><span class="field-label">{{ key }}</span>:&nbsp;{{ value }};&nbsp;</span></div><div data-ng-hide="!$ctrl.item.ui.expanded" class="expanded-item-info-block"><div class="igz-row common-table-cells-container item-info-row" data-ng-if="!$ctrl.isNil($ctrl.item.url)"><div class="igz-col-30 common-table-cell field-label">URL:</div><div class="igz-col-70 common-table-cell">{{ $ctrl.item.url }}</div></div><div class="igz-row common-table-cells-container item-info-row" data-ng-if="!$ctrl.isNil($ctrl.item.maxWorkers)"><div class="igz-col-30 common-table-cell field-label">Max Workers:</div><div class="igz-col-70 common-table-cell">{{ $ctrl.item.maxWorkers }}</div></div><div class="igz-row common-table-cells-container item-info-row" data-ng-repeat="(key, value) in $ctrl.item.attributes"><div class="igz-col-30 common-table-cell field-label">{{ key }}:</div><div class="igz-col-70 common-table-cell">{{ value }}</div></div></div></div></div><div data-ng-transclude class="igz-col-100" data-ng-if="$ctrl.item.ui.editModeActive"></div><div class="common-table-cell actions-menu"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div></div></div>');
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
    '<div class="ncl-navigation-tabs clearfix"><div class="navigation-tab" data-ng-repeat="item in $ctrl.tabItems" data-ui-sref="{{item.uiRoute}}" data-ui-sref-active="active">{{item.tabName | uppercase}}</div></div>');
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
  $templateCache.put('nuclio/common/components/monaco/monaco.tpl.html',
    '<div class="ncl-monaco"><div igz-monaco-editor data-code-file="selectedCodeFile" data-editor-theme="$ctrl.selectedTheme"></div></div>');
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
    '<section data-igz-extend-background><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><igz-info-page-filters data-is-filters-showed="$ctrl.isFiltersShowed.value" data-apply-filters="$ctrl.onApplyFilters()" data-reset-filters="$ctrl.onResetFilters()" data-change-state-callback="$ctrl.isFiltersShowed.changeValue(newVal)" data-toggle-method="$ctrl.toggleFilters()"><igz-search-input class="info-page-filters-item igz-component" data-data-set="$ctrl.functions" data-search-keys="$ctrl.searchKeys" data-search-callback="$ctrl.onUpdateFiltersCounter(searchQuery)" data-placeholder="Search projects..." data-live-search="false" data-search-states="$ctrl.searchStates"></igz-search-input></igz-info-page-filters><igz-info-page-actions-bar class="igz-component"><div class="actions-bar-left"><igz-action-panel data-actions="$ctrl.actions"></igz-action-panel></div><div class="actions-bar-right"><div class="actions-bar-left actions-buttons-block"><button class="ncl-new-entity-button" data-ng-click="$ctrl.openNewFunctionScreen()" data-tooltip="Create a function" data-tooltip-placement="bottom" data-tooltip-append-to-body="true" data-tooltip-popup-delay="100" data-tooltip-class="custom-tooltip">Create function</button></div><div class="actions-bar-left actions-content-block"><div class="igz-action-panel"><div class="actions-list"><igz-action-item-refresh data-refresh="$ctrl.refreshFunctions()"></igz-action-item-refresh><igz-sort-dropdown class="igz-component pull-left" data-sort-options="$ctrl.sortOptions" data-reverse-sorting="$ctrl.isReverseSorting" data-update-data-callback="$ctrl.onSortOptionsChange" data-tooltip="Sort" data-tooltip-append-to-body="true" data-tooltip-placement="top"></igz-sort-dropdown></div></div></div><igz-actions-panes data-filters-toggle-method="$ctrl.toggleFilters()" data-filters-counter="$ctrl.filtersCounter" data-show-filter-icon="true"></igz-actions-panes></div></igz-info-page-actions-bar><igz-info-page-content class="igz-component"><div class="common-table"><div class="common-table-header"><igz-action-checkbox-all data-ng-class="{\'invisible\': !$ctrl.isDemoMode()}" class="common-table-cell check-all-rows" data-items-count="$ctrl.getVersions().length"></igz-action-checkbox-all><div class="igz-row common-table-cells-container"><div class="igz-col-25 common-table-cell sortable" data-ng-class="$ctrl.isColumnSorted(\'metadata.name\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'metadata.name\')">Name<span class="sort-arrow"></span></div><div class="igz-col-25 common-table-cell sortable" data-ng-class="$ctrl.isColumnSorted(\'spec.description\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.description\')">Description<span class="sort-arrow"></span></div><div class="igz-col-10 common-table-cell sortable" data-ng-class="$ctrl.isColumnSorted(\'status.state\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'status.state\')">Status<span class="sort-arrow"></span></div><div class="igz-col-10 common-table-cell sortable" data-ng-class="$ctrl.isColumnSorted(\'spec.replicas\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.replicas\')">Replicas<span class="sort-arrow"></span></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">Invocation per sec</div><div class="igz-col-10 common-table-cell sortable" data-ng-class="$ctrl.isColumnSorted(\'spec.runtime\', $ctrl.sortedColumnName, $ctrl.isReverseSorting)" data-ng-click="$ctrl.sortTableByColumn(\'spec.runtime\')">Runtime<span class="sort-arrow"></span></div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">Last modified</div></div><div class="common-table-cell actions-menu">&nbsp;</div></div><div class="search-input-not-found" data-ng-if="$ctrl.isFunctionsListEmpty()">There are currently no functions, you can create a function by clicking the ‘Create Function’ button</div><div class="common-table-body"><div data-igz-extend-background><div class="igz-scrollable-container" id="dataLifecycleSortableArea" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.configScrollbar()"><div class="sortable-wrapper" data-ng-hide="$ctrl.searchStates.searchNotFound && $ctrl.searchStates.searchInProgress" data-ng-model="$ctrl.data.working.ui.children"><div class="data-lifecycle-layers" data-ng-repeat="function in $ctrl.functions"><div data-igz-show-hide-search-item="function"><ncl-function-collapsing-row data-function="function" data-project="$ctrl.project" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItems)"></ncl-function-collapsing-row></div></div></div></div></div></div></div></igz-info-page-content></section>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/create-function/create-function.tpl.html',
    '<igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="new-function-wrapper"><div class="new-function-header"><div class="title">Start a new function</div><div class="new-function-type"><div class="function-from-scratch-wrapper"><div class="function-from-scratch" data-ng-click="$ctrl.selectFunctionType(\'from_scratch\')" data-ng-class="{\'selected\': $ctrl.isTypeSelected(\'from_scratch\')}"><div class="function-type-icon"><span class="ncl-icon-add icon"></span></div><div class="function-type-info"><div class="type-title">Start from scratch</div><div class="type-description">Start with a simple "hello" example</div></div></div></div><div class="function-from-template-wrapper"><div class="function-from-template" data-ng-click="$ctrl.selectFunctionType(\'from_template\')" data-ng-class="{\'selected\': $ctrl.isTypeSelected(\'from_template\')}"><div class="function-type-icon"><span class="ncl-icon-template icon"></span></div><div class="function-type-info"><div class="type-title">Templates</div><div class="type-description">Choose a preconfigured template as starting point for your nuclio function</div></div></div></div></div></div><div class="new-function-type-wrapper"><div class="new-function-type-content"><ncl-function-from-scratch data-ng-if="$ctrl.isTypeSelected(\'from_scratch\')" data-toggle-splash-screen="$ctrl.toggleSplashScreen(value)" data-project="$ctrl.project"></ncl-function-from-scratch><ncl-function-from-template data-ng-if="$ctrl.isTypeSelected(\'from_template\')" data-toggle-splash-screen="$ctrl.toggleSplashScreen(value)" data-project="$ctrl.project"></ncl-function-from-template></div></div></div></div>');
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
    '<div class="ncl-function-collapsing-row items-wrapper"><div class="scrolling-row"></div><div class="function-title-block common-table-row"><div class="common-table-cell function-row-collapse"><span data-ng-if="$ctrl.function.spec.version > -1" class="collapse-icon" data-ng-click="$ctrl.isCollapsed = !$ctrl.isCollapsed" data-ng-class="{\'collapsed igz-icon-right\': $ctrl.isCollapsed, \'igz-icon-down\': !$ctrl.isCollapsed}"></span></div><div class="igz-row common-table-cells-container" data-ng-click="$ctrl.onSelectRow($event)"><div class="igz-col-25 common-table-cell function-name">{{$ctrl.function.metadata.name}}</div><div class="igz-col-25 common-table-cell">{{$ctrl.function.spec.description}}</div><div class="igz-col-10 common-table-cell">{{$ctrl.function.status.state}}</div><div class="igz-col-10 common-table-cell">{{$ctrl.function.spec.replicas}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{$ctrl.function.spec.invocation || 0}}</div><div class="igz-col-10 common-table-cell">{{$ctrl.function.spec.runtime}}</div><div data-ng-if="$ctrl.isDemoMode()" class="igz-col-10 common-table-cell">{{$ctrl.function.attr.last_modified | date:"MMM dd, yyyy"}}</div></div><div class="common-table-cell actions-menu"><igz-action-menu data-actions="$ctrl.actions" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu></div></div><div class="items-wrapper" data-ui-sortable="$ctrl.sortableConfig" data-ng-model="$ctrl.layer.ui.children" data-collapse="$ctrl.isCollapsed"><div data-ng-repeat="version in $ctrl.function.versions"><ncl-function-version-row class="function-version-wrapper" data-version="version" data-function="$ctrl.function" data-project="$ctrl.project" data-versions-list="$ctrl.function.attr.versions" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItems)"></ncl-function-version-row></div></div></div>');
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
    '<div class="ncl-edit-version"><igz-splash-screen data-is-splash-showed="$ctrl.isSplashShowed"></igz-splash-screen><igz-info-page-actions-bar class="igz-component border-top"><div class="actions-bar-right"><div class="actions-bar-left actions-buttons-block actions-dropdown-block"><igz-default-dropdown data-select-property-only="id" data-placeholder="ACTIONS" data-values-array="$ctrl.actions" data-selected-item="$ctrl.action" data-is-disabled="!$ctrl.isFunctionDeployed" data-item-select-callback="$ctrl.onSelectAction(item)"></igz-default-dropdown></div><div class="actions-bar-left actions-buttons-block"><div class="actions-bar-left test-events-dropdown-block"><igz-default-dropdown data-placeholder="No function events…" data-values-array="$ctrl.functionEvents" data-selected-item="$ctrl.selectedFunctionEvent" data-is-disabled="!$ctrl.isFunctionDeployed || !$ctrl.selectedFunctionEvent" data-item-select-callback="$ctrl.onSelectFunctionEvent(item)"></igz-default-dropdown></div><div class="actions-bar-right"><div class="ncl-grouped-buttons"><button type="button" class="test-version-button" data-ng-click="$ctrl.invokeFunction()" data-ng-class="{\'disabled\' : !$ctrl.isFunctionDeployed || !$ctrl.selectedFunctionEvent}">TEST</button><button type="button" class="test-version-button-arrow dropdown-toggle" data-toggle="dropdown" data-ng-class="{\'disabled\' : !$ctrl.isFunctionDeployed}" aria-haspopup="true" aria-expanded="false"><span class="igz-icon-dropdown"></span></button><ul class="button-dropdown dropdown-menu"><li><a class="icon-font-group" href="#" data-ng-click="$ctrl.openFunctionEventDialog(true)">Create function event</a></li><li data-ng-if="$ctrl.selectedFunctionEvent"><a class="icon-font-layer" href="#" data-ng-click="$ctrl.openFunctionEventDialog(false)">Edit test event</a></li><li data-ng-if="$ctrl.selectedFunctionEvent"><a class="icon-font-layer" href="#" data-ng-click="$ctrl.deleteFunctionEvent()">Delete event</a></li></ul></div></div></div><div class="actions-bar-left actions-buttons-block"><button class="ncl-new-entity-button" data-ng-class="{\'disabled\': $ctrl.deployResult.status.state === \'building\'}" data-ng-click="$ctrl.deployResult.status.state === \'building\' || $ctrl.deployVersion()" data-tooltip="Deploy a version" data-tooltip-placement="bottom" data-tooltip-append-to-body="true" data-tooltip-popup-delay="100" data-tooltip-class="custom-tooltip">Deploy</button></div></div></igz-info-page-actions-bar><div data-ng-if="$ctrl.isTestResultShown" class="ncl-edit-version-execution-result"><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="btn-close igz-icon-close" data-ng-click="$ctrl.toggleTestResult()"></div><div class="ncl-execution-result-status" data-ng-class="{\'succeeded\': $ctrl.testResult.status.state === \'Succeeded\'}"><span class="result-status-icon" data-ng-class="$ctrl.testResult.status.state === \'Succeeded\' ? \'igz-icon-tick-round\' : \'igz-icon-block\'"></span>Execution results: {{$ctrl.testResult.status.state}}</div><div class="ncl-execution-result-block"><div class="collapsed-block-title" data-ng-click="$ctrl.onRowCollapse(\'statusCode\')" data-ng-class="{\'collapsed\': $ctrl.rowIsCollapsed.statusCode}"><span class="icon-collapsed" data-ng-class="$ctrl.rowIsCollapsed.statusCode ? \'igz-icon-right\' : \'igz-icon-down\'"></span>Status code</div><div class="collapsed-block-content-wrapper" data-collapse="$ctrl.rowIsCollapsed.statusCode"><div class="value-row">{{$ctrl.testResult.status.code}}</div></div></div><div class="ncl-execution-result-block"><div class="collapsed-block-title" data-ng-click="$ctrl.onRowCollapse(\'headers\')" data-ng-class="{\'collapsed\': $ctrl.rowIsCollapsed.headers}"><span class="icon-collapsed" data-ng-class="$ctrl.rowIsCollapsed.headers ? \'igz-icon-right\' : \'igz-icon-down\'"></span>Headers</div><div class="collapsed-block-content-wrapper" data-collapse="$ctrl.rowIsCollapsed.headers"><div class="label-value-row" data-ng-repeat="(headerName, headerValue) in $ctrl.testResult.headers"><div class="label-cell">{{headerName}}</div><div class="value-cell">{{headerValue}}</div></div></div></div><div class="ncl-execution-result-block"><div class="collapsed-block-title" data-ng-click="$ctrl.onRowCollapse(\'body\')" data-ng-class="{\'collapsed\': $ctrl.rowIsCollapsed.body}"><span class="icon-collapsed" data-ng-class="$ctrl.rowIsCollapsed.body ? \'igz-icon-right\' : \'igz-icon-down\'"></span>Body</div><div class="collapsed-block-content-wrapper" data-collapse="$ctrl.rowIsCollapsed.body"><div class="value-row">{"metadata":{"name":"name","namespace":"nuclio"}}</div></div></div></div></div><div data-ng-if="$ctrl.isDeployResultShown" class="ncl-edit-version-execution-result deploy-result" data-ng-class="{\'in-progress\': $ctrl.deployResult.status.state === \'building\',\n' +
    '                         \'failed\'     : $ctrl.deployResult.status.state === \'error\'}"><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="btn-close igz-icon-close" data-ng-if="$ctrl.deployResult.status.state !== \'building\'" data-ng-click="$ctrl.toggleDeployResult()"></div><div class="icon-collabled general-content" data-ng-class="$ctrl.rowIsCollapsed.deployBlock ? \'igz-icon-right\' : \'igz-icon-down\'" data-ng-click="$ctrl.onRowCollapse(\'deployBlock\')"></div><div class="ncl-execution-result-status" data-ng-class="{\'succeeded\'  : $ctrl.deployResult.status.state === \'ready\',\n' +
    '                                 \'in-progress\': $ctrl.deployResult.status.state === \'building\',\n' +
    '                                 \'collapsed\'  : $ctrl.rowIsCollapsed.deployBlock}"><span class="result-status-icon" data-ng-class="{\'igz-icon-tick-round\': $ctrl.deployResult.status.state === \'ready\',\n' +
    '                              \'igz-icon-properties\': $ctrl.deployResult.status.state === \'building\',\n' +
    '                              \'igz-icon-block\'     : $ctrl.deployResult.status.state === \'error\'}"></span>{{$ctrl.getDeployStatusState($ctrl.deployResult.status.state)}}</div><div class="ncl-execution-result-block collapsed-block-content-wrapper" data-collapse="$ctrl.rowIsCollapsed.deployBlock"><div class="collapsed-block-title" data-ng-click="$ctrl.onRowCollapse(\'deployBody\')" data-ng-class="{\'collapsed\': $ctrl.rowIsCollapsed.deployBody}"><span class="icon-collapsed" data-ng-class="$ctrl.rowIsCollapsed.deployBody ? \'igz-icon-right\' : \'igz-icon-down\'"></span>Logs</div><div class="collapsed-block-content-wrapper" data-collapse="$ctrl.rowIsCollapsed.deployBody"><div class="value-row" data-ng-if="$ctrl.deployResult.status.logs" data-ng-class="{\'in-progress\': $ctrl.deployResult.status.state === \'building\',\n' +
    '                                         \'failed\'     : $ctrl.deployResult.status.state === \'error\'}"><div data-ng-repeat="log in $ctrl.deployResult.status.logs">{{log.message}}</div></div></div></div></div></div><ncl-navigation-tabs data-tab-items="$ctrl.navigationTabsConfig"></ncl-navigation-tabs><section class="ncl-edit-version-view" data-igz-extend-background data-ui-view="version"></section></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/create-function/function-from-scratch/function-from-scratch.tpl.html',
    '<div class="function-from-scratch-content"><div class="title-wrapper"><span class="title">Start from scratch</span></div><div class="function-configuration"><form name="$ctrl.functionFromScratchForm" class="configuration-form"><div class="function-name-wrapper"><div class="function-name"><span class="input-label">Name*</span><igz-validating-input-field data-field-type="input" data-input-name="name" data-input-value="$ctrl.functionData.metadata.name" data-validation-is-required="true" data-validation-pattern="ctrl.validationPatterns.functionName" data-form-object="$ctrl.functionFromScratchForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-placeholder-text="Type function name"></igz-validating-input-field></div></div><div class="function-runtime-wrapper"><div class="function-runtime"><span class="input-label">Runtime*</span><igz-default-dropdown data-is-required="true" data-values-array="$ctrl.runtimes" data-selected-item="$ctrl.selectedRuntime" data-item-select-callback="$ctrl.onDropdownDataChange(item, isItemChanged)" data-form-object="$ctrl.functionFromScratchForm" data-input-name="runtime"></igz-default-dropdown><div class="bottom-bar"><button class="ncl-secondary-button" data-ng-click="$ctrl.cancelCreating($event)">CANCEL</button><button class="ncl-primary-button" data-ng-click="$ctrl.createFunction()">CREATE FUNCTION</button></div></div></div></form></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/create-function/function-from-template/function-from-template.tpl.html',
    '<div class="function-from-template-content"><form name="$ctrl.functionFromTemplateForm" class="configuration-form"><div class="function-name-wrapper"><div class="function-name"><span class="input-label">Name*</span><igz-validating-input-field data-field-type="input" data-input-name="name" data-input-value="$ctrl.functionData.metadata.name" data-validation-is-required="true" data-form-object="$ctrl.functionFromTemplateForm" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-validation-pattern="ctrl.validationPatterns.functionName" data-placeholder-text="Type function name"></igz-validating-input-field></div></div></form><div class="templates-wrapper"><span class="title">Choose a template</span><div class="function-templates"><div class="function-template-wrapper" data-ng-repeat="(key, value) in $ctrl.templates" data-ng-click="$ctrl.selectTemplate(key)" data-ng-class="{\'selected\': $ctrl.isTemplateSelected(key)}"><span class="template-check-box igz-icon-radio" data-ng-class="{\'selected\': $ctrl.isTemplateSelected(key)}"></span><div class="function-template-content"><div class="template-title">{{key}}</div><div class="template-description">{{value.spec.description}}</div></div></div></div><div class="bottom-bar"><button class="ncl-secondary-button" data-ng-click="$ctrl.cancelCreating($event)">CANCEL</button><button class="ncl-primary-button" data-ng-click="$ctrl.createFunction()">CREATE FUNCTION</button></div></div></div>');
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
    '<div class="function-event-wrapper"><div class="header"><div class="title">{{$ctrl.titleText}}</div><div class="close-button igz-icon-close" data-ng-click="$ctrl.closeEventDialog()"></div></div><div class="content"><form name="$ctrl.functionEventForm" class="event-form"><div class="field-wrapper"><div class="field-label">Name</div><div class="field-content"><igz-validating-input-field data-field-type="input" data-input-name="name" data-input-model-options="$ctrl.inputModelOptions" data-input-value="$ctrl.workingCopy.spec.displayName" data-validation-is-required="true" data-form-object="$ctrl.functionEventForm" data-update-data-callback="$ctrl.inputValueCallback(newData, \'name\')" data-placeholder-text="Type a name of event"></igz-validating-input-field></div></div><div class="field-wrapper"><div class="field-label">Method</div><div class="field-content"><igz-default-dropdown data-values-array="$ctrl.methods" data-selected-item="$ctrl.selectedMethod" data-item-select-callback="$ctrl.onSelectMethod(item, isItemChanged, field)" data-is-required="true" data-form-object="$ctrl.functionEventForm"></igz-default-dropdown></div></div><div class="field-wrapper"><div class="field-label">Content type</div><div class="field-content"><igz-default-dropdown data-values-array="$ctrl.headers" data-selected-item="$ctrl.selectedHeader" data-item-select-callback="$ctrl.onSelectHeader(item, isItemChanged, field)" data-is-required="true" data-form-object="$ctrl.functionEventForm"></igz-default-dropdown></div></div><div class="field-wrapper"><div class="field-label">Body</div><div class="field-content"><textarea class="event-body" data-ng-model="$ctrl.workingCopy.spec.body" data-ng-change="$ctrl.onChangeBody()" data-form-object="$ctrl.functionEventForm" placeholder="Type a body of event"></textarea></div></div></form><div class="event-error" data-ng-if="$ctrl.isDeployFailed">{{$ctrl.errorText}}</div></div><div class="bottom-bar"><div class="ncl-secondary-button" data-ng-click="$ctrl.closeEventDialog()">Cancel</div><div class="ncl-primary-button" tabindex="0" data-ng-class="{\'disabled\' : !$ctrl.isFormChanged}" data-ng-click="$ctrl.applyChanges()" data-ng-keydown="$ctrl.applyChanges($event)" data-ng-hide="$ctrl.isLoadingState">{{$ctrl.buttonText}}</div><div class="ncl-primary-button" data-ng-show="$ctrl.isLoadingState">Loading...</div></div></div>');
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
    '<div class="tab-content-wrapper"><div class="ncl-edit-version-code ncl-version"><div class="section-wrapper code-entry-section"><form name="$ctrl.versionCodeForm"><div class="code-entry-row"><div class="code-entry-col code-entry-type-col"><div class="col-label code-entry-type">Code entry type</div><igz-default-dropdown data-values-array="$ctrl.codeEntryTypeArray" data-item-select-callback="$ctrl.selectEntryTypeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedEntryType" data-on-close-dropdown="$ctrl.onCloseDropdown()"></igz-default-dropdown></div><div class="code-entry-col code-entry-runtime-col"><div class="col-label runtime">Runtime</div><igz-default-dropdown data-values-array="$ctrl.runtimeArray" data-item-select-callback="$ctrl.selectRuntimeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedRuntime" data-is-disabled="true" data-on-close-dropdown="$ctrl.onCloseDropdown()"></igz-default-dropdown></div><div class="code-entry-col code-entry-handler-col"><div class="col-label handler">Handler</div><igz-validating-input-field data-field-type="input" data-input-name="handler" data-input-value="$ctrl.version.spec.handler" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.handler" data-form-object="$ctrl.versionCodeForm" data-placeholder-text="Handler"></igz-validating-input-field></div><div class="code-entry-col code-entry-button-col" data-ng-if="$ctrl.selectedEntryType.name === \'Upload archive\'"><button class="igz-button-primary upload-button"><span>UPLOAD</span><i class="igz-icon-upload"></i></button></div><div class="code-entry-col code-entry-theme-col" data-ng-if="$ctrl.selectedEntryType.name === \'Edit online\'"><div class="col-label runtime">Theme</div><igz-default-dropdown data-values-array="$ctrl.themesArray" data-item-select-callback="$ctrl.selectThemeValue(item, isItemChanged, field)" data-selected-item="$ctrl.selectedTheme" data-on-close-dropdown="$ctrl.onCloseDropdown()"></igz-default-dropdown></div></div><div ng-if="$ctrl.selectedEntryType.name === \'S3 URL\'" class="code-entry-row"><div class="code-entry-col code-entry-url-col"><div class="col-label handler">URL</div><igz-validating-input-field data-field-type="input" data-input-name="url" data-input-value="$ctrl.URL" data-update-data-callback="" data-form-object="$ctrl.versionCodeForm" data-placeholder-text="Type path..."></igz-validating-input-field></div></div></form></div><div data-ng-if="$ctrl.selectedEntryType.name === \'Edit online\'" class="code-edit-section"><ncl-monaco data-function-source-code="$ctrl.version.spec.build.functionSourceCode" data-selected-theme="$ctrl.selectedTheme.id" data-language="$ctrl.selectedRuntime.language" data-on-change-source-code-callback="$ctrl.onChangeSourceCode(sourceCode)"></ncl-monaco></div></div></div>');
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
    '<div class="ncl-version-configuration ncl-version" data-igz-extend-background><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="ncl-version-configuration-wrapper"><div class="row"><ncl-version-configuration-basic-settings class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-basic-settings><ncl-version-configuration-resources class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-resources></div><div class="row"><ncl-version-configuration-environment-variables class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-environment-variables></div><div class="row"><ncl-version-configuration-labels class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-labels><ncl-version-configuration-annotations class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-annotations></div><div class="row"><ncl-version-configuration-data-bindings class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-data-bindings><ncl-version-configuration-build class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-build></div><div data-ng-if="$ctrl.isDemoMode()" class="row"><ncl-version-configuration-logging class="configuration-block" data-version="$ctrl.version"></ncl-version-configuration-logging><ncl-version-configuration-runtime-attributes class="configuration-block runtime-attributes" data-ng-class="{\'invisible-block\': $ctrl.version.spec.runtime === \'shell\'}" data-version="$ctrl.version"></ncl-version-configuration-runtime-attributes></div></div></div></div>');
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
    '<div class="ncl-edit-version-monitoring ncl-version">Edit version monitoring tab</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-trigger/version-trigger.tpl.html',
    '<div class="ncl-version-trigger ncl-version"><div class="common-table"><div class="common-table-header header-row"><div class="common-table-cell header-name">Name</div><div class="common-table-cell header-class">Class</div><div class="igz-col-70 common-table-cell">Info</div></div><div class="common-table-body"><div data-igz-extend-background><div class="igz-scrollable-container" data-ng-scrollbars><ncl-collapsing-row data-ng-repeat="trigger in $ctrl.triggers" data-item="trigger" data-action-handler-callback="$ctrl.handleAction(actionType, selectedItem)"><ncl-edit-item class="common-table-cells-container edit-binding-row" data-item="trigger" data-type="trigger" data-on-submit-callback="$ctrl.editTriggerCallback(item)"></ncl-edit-item></ncl-collapsing-row><div class="common-table-row create-trigger-button" data-ng-click="$ctrl.createTrigger($event)"><span class="igz-icon-add-round"></span>Create a new trigger</div></div></div></div></div></div>');
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
    '<div class="ncl-version-configuration-basic-settings"><div class="title">Basic Settings</div><form name="$ctrl.basicSettingsForm" class="basic-settings-wrapper"><div class="row enable-checkbox"><input type="checkbox" class="small" id="enable" data-ng-model="$ctrl.enableFunction" data-ng-change="$ctrl.updateEnableStatus()"><label for="enable" class="checkbox-inline">Enabled</label></div><div class="row"><div class="namespace-block"><div class="label">Namespace</div><igz-validating-input-field data-field-type="input" data-input-name="namespace" data-input-value="$ctrl.version.metadata.namespace" data-is-focused="false" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="metadata.namespace" data-form-object="$ctrl.basicSettingsForm" data-placeholder-text="Type a namespace..."></igz-validating-input-field></div><div data-ng-if="$ctrl.isDemoMode()" class="timeout-block"><div class="label"><div class="timeout-checkbox"><input type="checkbox" class="small" id="timeout" data-ng-model="$ctrl.enableTimeout"><label for="timeout" class="checkbox-inline">Timeout</label></div></div><div class="timeout-values"><div class="inputs"><igz-validating-input-field data-field-type="input" data-input-name="min" data-input-value="$ctrl.timeout.min" data-is-focused="false" data-is-disabled="!$ctrl.enableTimeout" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="timeout.min" data-form-object="$ctrl.basicSettingsForm" data-validation-is-required="true" data-validation-pattern="$ctrl.validationPatterns.digits" data-placeholder-text="Min..."></igz-validating-input-field><div class="values-label">min</div><igz-validating-input-field data-field-type="input" data-input-name="sec" data-input-value="$ctrl.timeout.sec" data-is-focused="false" data-is-disabled="!$ctrl.enableTimeout" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="timeout.sec" data-form-object="$ctrl.basicSettingsForm" data-validation-is-required="true" data-validation-pattern="$ctrl.validationPatterns.digits" data-placeholder-text="Sec..."></igz-validating-input-field><div class="values-label">sec</div></div></div></div></div><div class="row"><div class="description-block"><div class="label">Description</div><igz-validating-input-field data-field-type="input" data-input-name="description" data-input-value="$ctrl.version.spec.description" data-is-focused="false" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.description" data-form-object="$ctrl.basicSettingsForm" data-placeholder-text="Type description..."></igz-validating-input-field></div></div></form></div>');
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
    '<div class="ncl-version-configuration-annotations"><div class="title">Annotations</div><form name="$ctrl.annotationsForm" class="annotations-wrapper"><div class="table-headers"><div class="key-header">Key</div><div class="value-header">Value</div></div><div data-ng-if="!$ctrl.isScrollNeeded()"><div class="table-body" data-ng-repeat="annotation in $ctrl.annotations"><ncl-key-value-input class="new-label-input" data-list-class="ncl-version-configuration-annotations" data-row-data="annotation" data-use-type="false" data-item-index="$index" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div data-ng-if="$ctrl.isScrollNeeded()" class="igz-scrollable-container scrollable-annotations" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="annotation in $ctrl.annotations"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-annotations" data-row-data="annotation" data-use-type="false" data-item-index="$index" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-annotation-button" data-ng-click="$ctrl.addNewAnnotation($event)"><span class="igz-icon-add-round"></span>Create a new annotation</div></form></div>');
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
    '<div class="ncl-version-configuration-build"><igz-action-menu data-ng-if="$ctrl.isDemoMode()" data-actions="$ctrl.actions" data-icon-class="ncl-icon-paperclip" data-on-fire-action="$ctrl.onFireAction"></igz-action-menu><div class="title">Build</div><form name="$ctrl.buildForm" class="build-wrapper"><div class="igz-row"><div class="igz-col-100 build-field"><div class="field-label">Build base image</div><igz-default-dropdown data-is-required="true" data-select-property-only="value" data-values-array="$ctrl.datasetTypesList" data-selected-item="$ctrl.version.spec.build.baseImage" data-item-select-callback="$ctrl.onBaseImageChange(item)" data-placeholder="Select ..." data-form-object="$ctrl.buildForm" data-input-name="baseImageName"></igz-default-dropdown></div><div class="igz-col-100 build-field"><div class="field-label">Build commands</div><igz-validating-input-field data-field-type="textarea" data-input-name="commands" data-input-value="$ctrl.buildCommands" data-is-focused="false" data-form-object="$ctrl.buildForm" data-placeholder-text="Type ..." data-update-data-callback="$ctrl.inputValueCallback(newData)" data-update-data-field="Commands" class="build-command-field"></igz-validating-input-field></div><div class="igz-col-100 build-field files-field"><div class="uploading-files"><div class="uploading-proccess-wrapper" data-ng-class="{\'one-file-uploaded\': $ctrl.file.uploaded || $ctrl.script.uploaded}" data-ng-if="$ctrl.getFileConfig().uploading && $ctrl.getFileConfig().name"><div class="file-block uploading text-ellipsis" data-ng-class="{\'uploading-file\': $ctrl.file.uploading}"><span class="{{$ctrl.getFileConfig().icon}}"></span><button class="build-close-button"><span class="ncl-icon-close"></span></button><span class="file-name">{{$ctrl.getFileConfig().name}}</span><div class="progress"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" data-ng-style="{\'width\': $ctrl.getFileConfig().progress}"></div></div></div></div><div class="uploaded-wrapper" data-ng-if="$ctrl.file.uploaded|| $ctrl.script.uploaded"><div class="file-block uploaded text-ellipsis" data-ng-if="$ctrl.script.uploaded" data-ng-class="{\'one-file-uploaded\': $ctrl.file.uploaded}"><span class="ncl-icon-script"></span><span class="file-name">{{$ctrl.script.name}}<span class="uploaded-file-directory">(/usr/bin/mybinary)</span></span><button class="build-close-button" data-ng-click="$ctrl.deleteFile(\'script\')"><span class="ncl-icon-close"></span></button></div><div class="file-block uploaded text-ellipsis uploaded-file" data-ng-if="$ctrl.file.uploaded"><span class="ncl-icon-file"></span><span class="file-name">{{$ctrl.file.name}}<span class="uploaded-file-directory">(/usr/bin/mybinary)</span></span><button class="build-close-button" data-ng-click="$ctrl.deleteFile(\'file\')"><span class="ncl-icon-close"></span></button></div></div></div></div></div></form></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-data-bindings/version-configuration-data-bindings.tpl.html',
    '<div class="ncl-version-configuration-data-bindings"><div class="title">Data Bindings</div><form name="$ctrl.dataBindingsForm" class="data-bindings-wrapper"><div class="ncl-version-binding"><div class="common-table"><div class="common-table-header item-header"><div class="common-table-cell item-name">Name</div><div class="common-table-cell item-class">Class</div><div class="igz-col-70 common-table-cell">Info</div></div><div class="common-table-body"><div class="igz-scrollable-container" data-ng-scrollbars><ncl-collapsing-row data-ng-repeat="binding in $ctrl.bindings" data-item="binding" data-action-handler-callback="$ctrl.handleAction(actionType, selectedItem)"><ncl-edit-item class="common-table-cells-container edit-binding-row" data-item="binding" data-type="binding" data-on-submit-callback="$ctrl.editBindingCallback(item)"></ncl-edit-item></ncl-collapsing-row></div></div></div></div><div class="create-binding-button" data-ng-click="$ctrl.createBinding($event)"><span class="igz-icon-add-round"></span>Create a new binding</div></form></div>');
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
    '<div class="ncl-version-configuration-environment-variables"><div class="title">Environment Variables</div><form name="$ctrl.environmentVariablesForm" class="resources-wrapper"><div class="table-headers"><div class="key-header use-type">Key</div><div class="type-header">Type</div><div class="value-header use-type">Info</div></div><div data-ng-if="!$ctrl.isScrollNeeded()" class="igz-scrollable-container"><div class="table-body" data-ng-repeat="variable in $ctrl.variables"><ncl-key-value-input class="new-label-input" data-list-class="ncl-version-configuration-environment-variables" data-row-data="variable" data-item-index="$index" data-use-type="true" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div data-ng-if="$ctrl.isScrollNeeded()" class="igz-scrollable-container scrollable-environment-variables" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="variable in $ctrl.variables"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-environment-variables" data-row-data="variable" data-item-index="$index" data-use-type="true" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-variable-button" data-ng-click="$ctrl.addNewVariable($event)"><span class="igz-icon-add-round"></span>Create a new environment variable</div></form></div>');
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
    '<div class="ncl-version-configuration-labels"><div class="title">Labels</div><form name="$ctrl.labelsForm" class="labels-wrapper"><div class="table-headers"><div class="key-header">Key</div><div class="value-header">Value</div></div><div data-ng-if="!$ctrl.isScrollNeeded()"><div class="table-body" data-ng-repeat="label in $ctrl.labels"><ncl-key-value-input class="new-label-input" data-list-class="ncl-version-configuration-labels" data-row-data="label" data-item-index="$index" data-use-type="false" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div data-ng-if="$ctrl.isScrollNeeded()" class="igz-scrollable-container scrollable-labels" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="label in $ctrl.labels"><ncl-key-value-input class="new-label-input" data-list-class="scrollable-labels" data-row-data="label" data-item-index="$index" data-use-type="false" data-action-handler-callback="$ctrl.handleAction(actionType, index)" data-change-data-callback="$ctrl.onChangeData(newData, index)"></ncl-key-value-input></div></div><div class="create-label-button" data-ng-click="$ctrl.addNewLabel($event)"><span class="igz-icon-add-round"></span>Create a new label</div></form></div>');
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
    '<div class="ncl-version-configuration-logging"><div class="title">Logging</div><form name="$ctrl.loggingForm" class="logging-wrapper"><div class="igz-scrollable-container" data-ng-scrollbars><div class="row"><div class="logger-dropdown"><span class="label">Logger lever</span><igz-default-dropdown data-selected-item="$ctrl.version.spec.loggerSinks[0].level" data-select-property-only="type" data-dropdown-type="severity" data-item-select-callback="$ctrl.setPriority(item)" data-prevent-drop-up="true"></igz-default-dropdown></div><div class="logger-input"><span class="label">Logger destination</span><igz-validating-input-field data-field-type="input" data-input-name="arguments" data-input-value="$ctrl.version.spec.loggerSinks[0].sink" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="spec.loggerSinks[0].sink" data-form-object="$ctrl.loggingForm" data-placeholder-text="Type a destination..."></igz-validating-input-field></div></div></div></form></div>');
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
    '<div class="ncl-version-configuration-resources"><div class="title">Resources</div><form name="$ctrl.resourcesForm" class="resources-wrapper"><div class="row"><div data-ng-if="$ctrl.isDemoMode()" class="sliders-block"><div class="slider-row"><igz-slider-input-block data-slider-config="$ctrl.memorySliderConfig" data-measure-units="$ctrl.defaultMeasureUnits" data-slider-block-updating-broadcast=""></igz-slider-input-block></div><div class="slider-row"><igz-slider-input-block data-slider-config="$ctrl.cpuSliderConfig" data-measure-units="null" data-slider-block-updating-broadcast=""></igz-slider-input-block></div></div><div class="replicas-block"><div class="label">Replicas</div><div class="replicas-values"><div class="inputs"><igz-number-input data-form-object="$ctrl.resourcesForm" data-input-name="minReplicas" data-current-value="$ctrl.minReplicas" data-update-number-input-callback="$ctrl.numberInputCallback(newData, field)" data-update-number-input-field="minReplicas" data-placeholder="" data-decimal-number="0" data-value-step="1" data-min-value="0" data-max-value="$ctrl.maxReplicas"></igz-number-input><div class="values-label">min</div><igz-number-input data-form-object="$ctrl.resourcesForm" data-input-name="maxReplicas" data-current-value="$ctrl.maxReplicas" data-update-number-input-callback="$ctrl.numberInputCallback(newData, field)" data-update-number-input-field="maxReplicas" data-placeholder="" data-decimal-number="0" data-value-step="1" data-min-value="$ctrl.minReplicas"></igz-number-input><div class="values-label">max</div></div></div></div></div></form></div>');
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
    '<div class="ncl-version-configuration-runtime-attributes"><div class="title">Runtime Attributes</div><form name="$ctrl.runtimeAttributesForm" class="runtime-attributes-wrapper"><div class="row"><div class="runtime-title"><span class="label">Runtime</span><div class="runtime">{{$ctrl.version.spec.runtime}}</div></div><div class="arguments-input"><span class="label">Arguments</span><igz-validating-input-field data-field-type="input" data-input-name="arguments" data-input-value="$ctrl.data.arguments" data-update-data-callback="$ctrl.inputValueCallback(newData, field)" data-update-data-field="arguments" data-form-object="$ctrl.runtimeAttributesForm" data-placeholder-text="Type..."></igz-validating-input-field></div></div><div class="row key-value-row"><span class="label">Response headers</span><div class="table-headers"><div class="key-header">Key</div><div class="value-header">Value</div></div><div class="igz-scrollable-container" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfig"><div class="table-body" data-ng-repeat="attribute in $ctrl.attributes"><ncl-key-value-input class="new-label-input" data-row-data="attribute" data-use-type="false" data-action-handler-callback="$ctrl.handleAction(actionType, checkedItem)" data-change-data-callback="$ctrl.onChangeData(newData)"></ncl-key-value-input></div></div><div class="create-label-button" data-ng-click="$ctrl.addNewAttribute()"><span class="igz-icon-add-round"></span>Create a new runtime attribute</div></div></form></div>');
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
    '<div class="close-button ncl-icon-close" data-ng-click="$ctrl.onClose()"></div><div class="title"><span>Attach file</span></div><div class="main-content"><form name="attachFileForm" novalidate><div class="field-group"><div class="field-label">Remote path</div><igz-validating-input-field data-field-type="input" data-placeholder-text="Type path..."></igz-validating-input-field></div></form></div><div class="buttons"><div class="ncl-secondary-button" tabindex="0" data-ng-click="$ctrl.onClose()" data-ng-keydown="$ctrl.onClose($event)">Cancel</div><div class="ncl-primary-button" tabindex="0" ngf-select="$ctrl.uploadFile($file)">Browse</div></div>');
}]);
})();
