/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
(function () {
    'use strict';
    /*eslint complexity: ["error", 13]*/

    angular.module('iguazio.dashboard-controls')
        .component('igzDateTimePicker', {
            bindings: {
                customPresets: '<?',
                clearOption: '<?',
                inputDateFrom: '<',
                inputDateTo: '<?',
                isDateRange: '<',
                isDisabled: '<',
                isRequired: '<?',
                formObject: '<',
                pickFutureDates: '<',
                pickTime: '<',
                presetsList: '<?',
                selectedPreset: '@?',
                inputName: '@',
                onChangeModel: '&'
            },
            templateUrl: 'igz_controls/components/date-time-picker/date-time-picker.tpl.html',
            controller: IgzDateTimePickerController
        });

    /**
     * IGZ customization of `angular-bootstrap-date-time-picker` directives:
     * https://github.com/angular-ui/bootstrap/tree/master/src/datepicker
     * https://github.com/angular-ui/bootstrap/tree/master/src/timepicker
     * Bindings properties:
     * inputDateFrom - one way bound value (initial/start date)
     * inputDateTo - one way bound value (end date, not required)
     * isDateRange - boolean parameter (checks if true, then is displayed two calendars)(boolean)
     * isDisabled - boolean parameter (checks if true, input date field is disabled)(boolean)
     * isRequired - boolean parameter (checks if true, input of date is required)(boolean)
     * formObject - one way bound value, form object
     * pickFutureDates - boolean parameter (it allows/disallows to set future dates)
     * pickTime - boolean parameter (checks if true, then is displayed time pickers)
     * selectedOption - string parameter (current selected option from list: last day, etc)
     * inputName - name of input
     * onChangeModel - callback on item added
     */
    function IgzDateTimePickerController($document, $element, $scope, $timeout, $window, $i18next, i18next, lodash, moment, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        var defaultTime = {
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        };
        var defaultTimePart = {
            second: 0,
            millisecond: 0
        };
        var invalidFromDate = false;
        var invalidToDate = false;

        ctrl.date = {
            from: '',
            to: ''
        };
        ctrl.datepickerOptions = {
            from: {},
            to: {}
        };
        ctrl.displayText = '';

        /**
         * The preset list in drop-down of date-picker
         * label - the text to display when this preset is selected
         * getRange - a function that gets no arguments and returns an object with `from` and `to` properties
         *     representing the date-time range of the preset (`from` or `to` could be omitted, for "open" range)
         * @type {Object.<{label: string, getRange: function}>}
         */
        ctrl.defaultPresets = {
            hour: {
                label: 'Last hour',
                getRange: function () {
                    return {
                        from: moment().subtract(1, 'hours')
                    };
                }
            },
            day: {
                label: 'Last day',
                getRange: function () {
                    return {
                        from: moment().subtract(1, 'days')
                    };
                }
            },
            week: {
                label: 'Last week',
                getRange: function () {
                    return {
                        from: moment().subtract(1, 'weeks')
                    };
                }
            },
            month: {
                label: 'Last month',
                getRange: function () {
                    return {
                        from: moment().subtract(1, 'months')
                    };
                }
            },
            year: {
                label: 'Last year',
                getRange: function () {
                    return {
                        from: moment().subtract(1, 'years')
                    };
                }
            }
        };
        ctrl.isShowDatePicker = false;
        ctrl.isReverted = false;
        ctrl.isPositionCalculated = false;
        ctrl.isDateChanged = false;
        ctrl.isDropdownPositionCalculated = false;
        ctrl.isShowOptionsList = false;
        ctrl.placeholder = '';
        ctrl.presets = {};

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.applyChanges = applyChanges;
        ctrl.cancelChanges = cancelChanges;
        ctrl.clearSelectedDateTime = clearSelectedDateTime;
        ctrl.isOptionSelected = isOptionSelected;
        ctrl.getErrorMessage = getErrorMessage;
        ctrl.showDatepickerPopup = showDatepickerPopup;
        ctrl.showOptionsList = showOptionsList;
        ctrl.onChangeDateTime = onChangeDateTime;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (angular.isDefined(ctrl.customPresets)) {
                ctrl.presets = ctrl.customPresets;
            } else if (angular.isDefined(ctrl.presetsList)) {
                ctrl.presets = ctrl.presetsList.length > 0 ? lodash.pick(ctrl.defaultPresets, ctrl.presetsList) : {};
            } else {
                ctrl.presets = ctrl.defaultPresets;
            }

            ctrl.placeholder = ctrl.isDateRange ? ctrl.pickTime ? 'MMM D, YYYY h:mmA - MMM D, YYYY h:mmA' : 'MMM D, YYYY - MMM D, YYYY' :
                                                  ctrl.pickTime ? 'MMM D, YYYY h:mmA'                     : 'MMM D, YYYY';

            if (lodash.has(ctrl.presets, ctrl.selectedPreset)) {
                ctrl.displayText = ctrl.presets[ctrl.selectedPreset].label;
            }

            $scope.$on('info-page-filters_on-apply', onApplyFilters);
            $scope.$on('scrollable-container_on-scrolling', onContainerScrolling);

            setDatepickerOptions();
        }

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.inputDateFrom)) {
                if (changes.inputDateFrom.currentValue === '' || lodash.isNil(changes.inputDateFrom.currentValue)) {
                    ctrl.displayText = '';
                    ctrl.date.from = '';
                } else {
                    ctrl.date.from = moment(changes.inputDateFrom.currentValue).toDate();

                    if (lodash.has(ctrl.presets, ctrl.selectedPreset)) {
                        ctrl.displayText = ctrl.presets[ctrl.selectedPreset].label;
                    } else {
                        setInputDate();
                    }
                }
            }

            if (angular.isDefined(changes.inputDateTo)) {
                if (changes.inputDateTo.currentValue === '' || lodash.isNil(changes.inputDateTo.currentValue)) {
                    ctrl.date.to = '';
                } else {
                    ctrl.date.to = moment(changes.inputDateTo.currentValue).toDate();

                    if (lodash.has(ctrl.presets, ctrl.selectedPreset)) {
                        ctrl.displayText = ctrl.presets[ctrl.selectedPreset].label;
                    } else {
                        setInputDate();
                    }
                }
            }

            if (angular.isDefined(changes.selectedPreset)) {
                if (lodash.has(ctrl.presets, changes.selectedPreset.currentValue)) {
                    ctrl.displayText = ctrl.presets[changes.selectedPreset.currentValue].label;
                }
            }
        }

        //
        // Public methods
        //

        /**
         * Applies new date/date range and closes date picker
         */
        function applyChanges() {
            setDateTime();

            ctrl.isShowDatePicker = false;
            ctrl.isShowOptionsList = false;
            ctrl.selectedPreset = '';

            $document.off('click', unselectDropdown);
        }

        /**
         * Cancel changes and closes date picker
         */
        function cancelChanges() {
            ctrl.isShowDatePicker = false;
            ctrl.isShowOptionsList = false;

            $document.off('click', unselectDropdown);
        }

        /**
         * Clears selected date-time
         */
        function clearSelectedDateTime() {
            ctrl.selectedPreset = '';
            ctrl.datepickerOptions = {
                from: {},
                to: {}
            };

            ctrl.onChangeModel({
                newValue: {
                    to: null,
                    from: null
                },
                selectedPreset: ''
            });

            ctrl.cancelChanges();
        }

        /**
         * Tests whether the provided preset is selected
         * @param {string} preset
         * @returns {boolean}
         */
        function isOptionSelected(preset) {
            return ctrl.selectedPreset === preset;
        }

        /**
         * Gets error message for tooltip on 'Apply' button
         * @returns {string}
         */
        function getErrorMessage() {
            if (ctrl.pickTime && angular.element('.timepicker.from tbody tr').length > 0) {
                var time = {};

                if (invalidFromDate) {
                    var timePickerFromElements = angular.element('.timepicker.from tbody tr').get(1).children;
                    var timePickerFromBoxes = {
                        hours: timePickerFromElements[0],
                        minutes: timePickerFromElements[2]
                    };

                    lodash.assign(time, {
                        fromHour: angular.element(timePickerFromBoxes.hours).get(0).children[0].value,
                        fromMinute: angular.element(timePickerFromBoxes.minutes).get(0).children[0].value
                    });
                }

                if (invalidToDate && ctrl.isDateRange && angular.element('.timepicker.to tbody tr').length > 0) {
                    var timePickerToElements = angular.element('.timepicker.to tbody tr').get(1).children;
                    var timePickerToBoxes = {
                        hours: timePickerToElements[0],
                        minutes: timePickerToElements[2]
                    };

                    lodash.assign(time, {
                        toHour: angular.element(timePickerToBoxes.hours).get(0).children[0].value,
                        toMinute: angular.element(timePickerToBoxes.minutes).get(0).children[0].value
                    });
                }

                if (invalidFromDate || invalidToDate) {
                    return !lodash.every(time, isNumeric) ? $i18next.t('common:ERROR_MSG.DATE_TIME_PICKER.ONLY_DIGITS_ALLOWED', {lng: lng}) :
                              isIncorrectTimeFormat(time) ? $i18next.t('common:ERROR_MSG.DATE_TIME_PICKER.12_HOUR_TIME_ALLOWED', {lng: lng}) :
                                                            $i18next.t('common:ERROR_MSG.DATE_TIME_PICKER.FUTURE_DATES_NOT_ALLOWED', {lng: lng});
                }
            }

            return !isDateTimeRangeCorrect() ? $i18next.t('common:ERROR_MSG.DATE_TIME_PICKER.TO_LATER_THAN_FROM', {lng: lng}) : '';
        }

        /**
         * Shows options list
         * @param {Event} $event
         */
        function showOptionsList($event) {
            ctrl.isDropdownPositionCalculated = false;
            ctrl.isDateChanged = false;

            if (ctrl.isShowDatePicker) {
                ctrl.isShowDatePicker = false;
            }

            if (ctrl.displayText === '') {
                ctrl.selectedPreset = '';
            }

            if (angular.isUndefined($event.keyCode) || $event.keyCode === EventHelperService.ENTER) {
                ctrl.isShowOptionsList = !ctrl.isShowOptionsList;

                $timeout(function () {
                    angular.element($event.target).focus();
                });

                $timeout(showDropdownMenus);
            }
        }

        /**
         * Workaround of native Bootstrap Datepicker behavior
         * which sets focus to popup $element and calculates position of popup
         * @param {Event} $event
         */
        function showDatepickerPopup($event) {
            var currentDate = moment().utcOffset(0).set(defaultTimePart).toDate();

            ctrl.isPositionCalculated = false;
            ctrl.isShowOptionsList = false;

            if (!ctrl.pickFutureDates) {
                ctrl.datepickerOptions.from.maxDate = currentDate;
                ctrl.datepickerOptions.to.maxDate = currentDate;
            }

            ctrl.date.from = lodash.isNil(ctrl.inputDateFrom) || ctrl.inputDateFrom === '' ||
                             !lodash.isEmpty(ctrl.selectedPreset) ? currentDate :
                                                                    moment(ctrl.inputDateFrom).toDate();

            ctrl.date.to = lodash.isNil(ctrl.inputDateTo) || ctrl.inputDateTo === '' ||
                           !lodash.isEmpty(ctrl.selectedPreset) ? currentDate :
                                                                  moment(ctrl.inputDateTo).toDate();

            if (angular.isUndefined($event.keyCode) || $event.keyCode === EventHelperService.ENTER) {
                ctrl.isShowDatePicker = !ctrl.isShowDatePicker;

                $timeout(function () {
                    angular.element($event.target).focus();
                });

                $timeout(showDropdownMenus);
            }

            if (!ctrl.isDateRange) {
                $document.on('click', unselectDropdown);
                $document.on('keyup', onKeyUp);
            }
        }

        /**
         * Checks date sequence and sets default date ranges
         * @param {string} [preset=''] selected preset from dropdown list
         */
        function onChangeDateTime(preset) {
            ctrl.selectedPreset = '';
            ctrl.isDateChanged = true;

            if (lodash.has(ctrl.presets, preset)) {
                ctrl.isShowOptionsList = false;
                ctrl.selectedPreset = preset;

                ctrl.date = ctrl.presets[preset].getRange();

                $document.off('click', unselectDropdown);
            }

            if (!ctrl.pickTime) {
                var timeZoneOffset = moment(ctrl.date.from).utcOffset() * 60 * 1000;
                ctrl.date.from = moment(ctrl.date.from).set(defaultTime).add(timeZoneOffset, 'milliseconds').toDate();

                if (ctrl.isDateRange && angular.isDefined(ctrl.date.to)) {
                    timeZoneOffset = moment(ctrl.date.to).utcOffset() * 60 * 1000;
                    ctrl.date.to = moment(ctrl.date.to).set(defaultTime).add(timeZoneOffset, 'milliseconds').toDate();
                }
            } else if (angular.element('.timepicker.from tbody tr').length > 0) {
                var timePickerFromElements = angular.element('.timepicker.from tbody tr').get(1).children;
                var timePickerFromBoxes = {
                    hours: timePickerFromElements[0],
                    minutes: timePickerFromElements[2]
                };

                if (moment(ctrl.date.from).isAfter(ctrl.datepickerOptions.from.maxDate) || lodash.isNull(ctrl.date.from)) {
                    angular.element(timePickerFromBoxes.hours).addClass('invalid');
                    angular.element(timePickerFromBoxes.minutes).addClass('invalid');

                    invalidFromDate = true;
                } else {
                    angular.element(timePickerFromBoxes.hours).removeClass('invalid');
                    angular.element(timePickerFromBoxes.minutes).removeClass('invalid');

                    invalidFromDate = false;
                }

                if (ctrl.isDateRange) {
                    var timePickerToElements = angular.element('.timepicker.to tbody tr').get(1).children;
                    var timePickerToBoxes = {
                        hours: timePickerToElements[0],
                        minutes: timePickerToElements[2]
                    };

                    if (moment(ctrl.date.to).isAfter(ctrl.datepickerOptions.to.maxDate) || lodash.isNull(ctrl.date.to)) {
                        angular.element(timePickerToBoxes.hours).addClass('invalid');
                        angular.element(timePickerToBoxes.minutes).addClass('invalid');

                        invalidToDate = true;
                    } else {
                        angular.element(timePickerToBoxes.hours).removeClass('invalid');
                        angular.element(timePickerToBoxes.minutes).removeClass('invalid');

                        invalidToDate = false;
                    }
                }
            }

            if (angular.isDefined(preset)) {
                setDateTime(preset);
            }
        }

        //
        // Private method
        //

        /**
         * Checks is string value is a number contains with digits only
         * @param {string} value
         * @returns {boolean}
         */
        function isNumeric(value) {
            return /^\d+$/.test(value);
        }

        /**
         * Checks if time format is incorrect
         * @param {Object} time
         * @returns {boolean}
         */
        function isIncorrectTimeFormat(time) {
            return invalidFromDate && !isCorrectTime(Number(time.fromHour), Number(time.fromMinute)) ||
                   invalidToDate   && !isCorrectTime(Number(time.toHour), Number(time.toMinute));

            // checks if 01 < hour < 12 and 00 < minute < 59 or not (12-hour time format)
            function isCorrectTime(hour, minute) {
                var hourRange = {
                    max: 13,
                    min: 1
                };
                var minuteRange = {
                    max: 60,
                    min: 0
                };

                return lodash.inRange(hour, hourRange.min, hourRange.max) && lodash.inRange(minute, minuteRange.min, minuteRange.max);
            }
        }

        /**
         * Returns boolean value depending on whether there is a range correct/incorrect
         */
        function isDateTimeRangeCorrect() {
            return !ctrl.isDateRange ||
                   !lodash.isNil(ctrl.date.from) && !lodash.isNil(ctrl.date.to) &&
                   moment(ctrl.date.from).isBefore(ctrl.date.to);
        }

        /**
         * Sets changed date-time to input field
         */
        function setInputDate() {
            var dateFrom = moment(ctrl.date.from).format('MMM D, YYYY') + (ctrl.pickTime ? moment(ctrl.date.from).format(' h:mmA') : '');
            var dateTo = moment(ctrl.date.to).format('MMM D, YYYY') + (ctrl.pickTime ? moment(ctrl.date.to).format(' h:mmA') : '');

            ctrl.displayText = dateFrom + (ctrl.isDateRange ? ' - ' + dateTo : '');
        }

        /**
         * Sets datepicker options
         */
        function setDatepickerOptions() {
            ctrl.datepickerOptions = {
                from: {
                    showWeeks: false,
                    maxDate: null,
                    maxMode: 'day',
                    formatDayTitle: (ctrl.isDateRange ? 'Fro\'m\':' : ' ').toString() + ' MMMM yyyy'
                },
                to: {
                    showWeeks: false,
                    maxDate: null,
                    maxMode: 'day',
                    formatDayTitle: (ctrl.isDateRange ? 'To:' : ' ').toString() + ' MMMM yyyy'
                }
            };
        }

        /**
         * Recalculates date on applying filters
         */
        function onApplyFilters() {
            if (!lodash.isEmpty(ctrl.selectedPreset)) {
                onChangeDateTime(ctrl.selectedPreset);
            }
        }

        /**
         * Calculates position of dropdown menus and closes menus if date-picker input is not visible on scrolling
         */
        function onContainerScrolling() {
            var datePickerDropdownElement = ctrl.isShowDatePicker  ? angular.element($element.find('.date-time-pickers')) :
                                            ctrl.isShowOptionsList ? angular.element($element.find('.options-dropdown'))  : null;

            $timeout(showDropdownMenus);

            if (!lodash.isEmpty(datePickerDropdownElement)) {
                $timeout(function () {
                    var pageWrapper = $element.closest('.igz-scrollable-container');

                    if (pageWrapper.length !== 0 && pageWrapper[0].getBoundingClientRect().top > datePickerDropdownElement[0].offsetTop && !ctrl.isReverted) {
                        unselectDropdown();
                    }
                });
            }
        }

        /**
         * Key Up Callback
         * @param {Object} event - native event object
         */
        function onKeyUp(event) {

            // close date picker via ESC button
            if (event.keyCode === EventHelperService.ESCAPE) {
                unselectDropdown();
            }
        }

        /**
         * Handle click on the document and not on the datepicker and close the datepicker
         * @param {Event} [e] - event
         */
        function unselectDropdown(e) {
            if (angular.isUndefined(e) || $element.find(e.currentTarget.activeElement).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.isShowDatePicker = false;
                    ctrl.isShowOptionsList = false;

                    $document.off('click', unselectDropdown);
                    $document.off('keyup', onKeyUp);
                });
            }
        }

        /**
         * Calculates position of options dropdown and date-picker menu
         */
        function showDropdownMenus() {
            var datePickerDropdownElement = ctrl.isShowDatePicker  ? angular.element($element.find('.date-time-pickers')) :
                                            ctrl.isShowOptionsList ? angular.element($element.find('.options-dropdown'))  : null;
            var datePickerDropdownParent = angular.element($element.find('.date-time-picker'));
            var headerElement = angular.element('.igz-main-header');

            if (!lodash.isEmpty(datePickerDropdownElement) && !lodash.isEmpty(datePickerDropdownParent)) {
                var elementHeight = datePickerDropdownElement[0].clientHeight;
                var parentHeight = datePickerDropdownParent[0].clientHeight;
                var parentTop = datePickerDropdownParent[0].getBoundingClientRect().top;
                var parentLeft = datePickerDropdownParent[0].getBoundingClientRect().left;
                var roomAbove = parentTop - headerElement[0].clientHeight;

                // if there is not enough bottom room to put options dropdown it is necessary to put options dropdown to top
                if (ctrl.isShowOptionsList) {
                    if ($window.innerHeight - parentTop - parentHeight < elementHeight && roomAbove >= elementHeight) {
                        ctrl.isReverted = true;
                        datePickerDropdownElement.css('top', parentTop - elementHeight);
                    } else {
                        ctrl.isReverted = false;
                        datePickerDropdownElement.css('top', parentTop + parentHeight);
                    }
                    datePickerDropdownElement.css('left', parentLeft);
                    datePickerDropdownElement.css('width', datePickerDropdownParent[0].clientWidth);

                    ctrl.isDropdownPositionCalculated = true;
                    $document.on('click', unselectDropdown);
                    $document.on('keyup', onKeyUp);
                }

                if (ctrl.isShowDatePicker) {
                    lodash.forEach(angular.element('.date-time-pickers th small'), function (label) {
                        label.textContent = label.textContent.slice(0, 1);
                    });

                    var hasEnoughTopRoom = roomAbove >= elementHeight;

                    // if there is not enough bottom room to put date-picker it is necessary to check
                    // if there is enough top room to put date-picker. If not - to set date-picker's top position under header
                    if ($window.innerHeight - parentTop - parentHeight < elementHeight) {
                        ctrl.isReverted = true;
                        datePickerDropdownElement.css('top', hasEnoughTopRoom ?
                                                             parentTop - elementHeight :
                                                             headerElement[0].getBoundingClientRect().bottom);
                    } else {
                        ctrl.isReverted = false;
                        datePickerDropdownElement.css('top', parentTop + parentHeight);
                    }

                    if ($window.innerWidth - parentLeft < datePickerDropdownElement[0].clientWidth) {
                        var rightPosition = $window.innerWidth - datePickerDropdownParent[0].getBoundingClientRect().right;
                        datePickerDropdownElement.css('right', rightPosition > 0 ? rightPosition : 0);
                    } else {
                        datePickerDropdownElement.css('left', parentLeft);
                    }

                    ctrl.isPositionCalculated = true;
                }
            }
        }

        /**
         * Sets date and time to input field in  format 'MMM D, h:mmA'
         * @param {string} [preset=''] selected preset from dropdown list
         */
        function setDateTime(preset) {
            if (!lodash.isNil(ctrl.date.from)) {
                var newValue = {
                    from: ctrl.pickTime ? moment(ctrl.date.from).set(defaultTimePart).toDate() : moment(ctrl.date.from).utcOffset(0).set(defaultTime).toDate()
                };
                ctrl.inputDateFrom = ctrl.date.from;

                setInputDate();

                if (!lodash.isNil(ctrl.date.to) && moment(ctrl.date.from).isBefore(ctrl.date.to)) {
                    ctrl.inputDateTo = ctrl.date.to;

                    setInputDate();

                    newValue.to = ctrl.pickTime ? moment(ctrl.date.to).set(defaultTimePart).toDate() : moment.utc(ctrl.date.to).set(defaultTime).toDate();
                }

                if (lodash.has(ctrl.presets, preset)) {
                    ctrl.displayText = ctrl.presets[preset].label;
                }

                if (angular.isFunction(ctrl.onChangeModel)) {
                    ctrl.onChangeModel({
                        newValue: ctrl.isDateRange ? newValue : newValue.from,
                        selectedPreset: ctrl.selectedPreset
                    });
                }
            }
        }
    }
}());
