describe('igzDateTimePicker component:', function () {
    var $componentController;
    var $rootScope;
    var $timeout;
    var moment;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$timeout_, _moment_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            moment = _moment_;
        });

        var dateValue = {
            from: new Date('2016-02-26T14:47:35.738Z'),
            to: new Date('2016-02-28T14:47:35.738Z')
        };

        var bindings = {
            inputDateFrom: dateValue.from,
            inputDateTo: dateValue.to,
            pickFutureDates: true,
            onChangeModel: angular.noop,
            selectedPreset: 'hour'
        };
        var element = angular.element('<igz-date-time-picker></igz-date-time-picker>');

        ctrl = $componentController('igzDateTimePicker', {$element: element}, bindings);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $timeout = null;
        moment = null;
        ctrl = null;
    });

    describe('showDatePickerPopup(): ', function () {
        it('should show date picker popup and allow to set future dates', function () {
            ctrl.isShowDatePicker = false;
            ctrl.pickFutureDates = true;
            ctrl.selectedPreset = '';

            ctrl.showDatepickerPopup({});

            expect(ctrl.isShowDatePicker).toBeTruthy();
            expect(ctrl.date.from).toEqual(ctrl.inputDateFrom);
            expect(ctrl.date.to).toEqual(ctrl.inputDateTo);
            expect(ctrl.datepickerOptions.from.maxDate).toBeNull();
            expect(ctrl.datepickerOptions.to.maxDate).toBeNull();
        });

        it('should show date picker popup and set current date when selectedPreset is chosen', function () {
            var defaultTimePart = {
                second: 0,
                millisecond: 0
            };
            var currentDate = moment().utcOffset(0).set(defaultTimePart).toDate();

            ctrl.date.from = new Date('2016-01-01T14:47:35.738Z');
            ctrl.selectedPreset = 'week';

            ctrl.showDatepickerPopup({});

            expect(ctrl.date.from).toEqual(currentDate);
        });

        it('should show date picker popup and set previous selected range when it is chosen', function () {
            var date = new Date('2016-01-01T14:47:00.000Z');

            ctrl.inputDateFrom = date;
            ctrl.selectedPreset = '';

            ctrl.showDatepickerPopup({});

            expect(ctrl.date.from).toEqual(date);
        });

        it('should show date picker popup and set max date (not allow to set future dates)', function () {
            ctrl.isShowDatePicker = true;
            ctrl.pickFutureDates = false;
            ctrl.selectedPreset = '';

            var defaultTimePart = {
                second: 0,
                millisecond: 0
            };

            ctrl.showDatepickerPopup({});

            expect(ctrl.isShowDatePicker).toBeFalsy();
            expect(ctrl.date.from).toEqual(ctrl.inputDateFrom);
            expect(ctrl.date.to).toEqual(ctrl.inputDateTo);
            expect(ctrl.datepickerOptions.from.maxDate).toEqual(moment().utcOffset(0).set(defaultTimePart).toDate());
            expect(ctrl.datepickerOptions.to.maxDate).toEqual(moment().utcOffset(0).set(defaultTimePart).toDate());
        });
    });

    describe('showOptionsList(): ', function () {
        it('should change ctrl.isShowOptionsList', function () {
            ctrl.isShowOptionsList = false;

            ctrl.showOptionsList({});

            expect(ctrl.isShowOptionsList).toBeTruthy();
        });
    });

    describe('isOptionSelected(): ', function () {
        it('should return true if provided with the currently selected preset', function () {
            expect(ctrl.isOptionSelected('hour')).toBeTruthy();
        });

        it('should return flase if provided with a preset other than the currently selected preset', function () {
            expect(ctrl.isOptionSelected('day')).toBeFalsy();
        });
    });

    describe('onChangeDateTime(): ', function () {
        it('should set value to input field and call ctrl.onChangeModel if time picker is available and date range', function () {
            spyOn(ctrl, 'onChangeModel');

            ctrl.pickTime = true;
            ctrl.isDateRange = true;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z'),
                to: new Date('2016-01-05T14:47:35.738Z')
            };

            var expectedDate = {
                from: new Date('2016-01-01T14:47:00.000Z'),
                to: new Date('2016-01-05T14:47:00.000Z')
            };
            var convertedDate = moment(ctrl.date.from).format('MMM D, YYYY') + moment(ctrl.date.from).format(' h:mmA') + ' - ' +
                moment(ctrl.date.to).format('MMM D, YYYY') + moment(ctrl.date.to).format(' h:mmA');

            ctrl.isShowDatePicker = true;
            ctrl.isShowOptionsList = true;
            ctrl.selectedPreset = '';
            ctrl.showOptionsList({});
            ctrl.applyChanges();

            $timeout.flush();

            expect(ctrl.displayText).toEqual(convertedDate);
            expect(ctrl.onChangeModel).toHaveBeenCalledWith({newValue: expectedDate, selectedPreset: ''});
        });

        it('should set value to input field and call ctrl.onChangeModel if time picker is not available and date range', function () {
            spyOn(ctrl, 'onChangeModel');

            ctrl.pickTime = false;
            ctrl.isDateRange = true;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z'),
                to: new Date('2016-01-05T14:47:35.738Z')
            };

            var convertedDate = moment(ctrl.date.from).format('MMM D, YYYY') + ' - ' + moment(ctrl.date.to).format('MMM D, YYYY');
            var newValue = {
                from: new Date('2016-01-01T00:00:00.000Z'),
                to: new Date('2016-01-05T00:00:00.000Z')
            };

            ctrl.isShowDatePicker = true;
            ctrl.isShowOptionsList = true;
            ctrl.selectedPreset = '';
            ctrl.showOptionsList({});
            ctrl.applyChanges();

            $timeout.flush();

            expect(ctrl.displayText).toEqual(convertedDate);
            expect(ctrl.onChangeModel).toHaveBeenCalledWith({newValue: newValue, selectedPreset: ''});
        });

        it('should set value to input field and call ctrl.onChangeModel if time picker is not available and not date range', function () {
            spyOn(ctrl, 'onChangeModel');

            ctrl.pickTime = false;
            ctrl.isDateRange = false;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z')
            };

            var convertedDate = moment(ctrl.date.from).format('MMM D, YYYY');
            var newValue = {
                from: new Date('2016-01-01T00:00:00.000Z')
            };

            ctrl.isShowDatePicker = true;
            ctrl.isShowOptionsList = true;
            ctrl.selectedPreset = '';
            ctrl.showOptionsList({});
            ctrl.applyChanges();

            $timeout.flush();

            expect(ctrl.displayText).toEqual(convertedDate);
            expect(ctrl.onChangeModel).toHaveBeenCalledWith({newValue: newValue.from, selectedPreset: ''});
        });

        it('should set value to input field and call ctrl.onChangeModel if time picker is available and not date range', function () {
            spyOn(ctrl, 'onChangeModel');

            ctrl.pickTime = true;
            ctrl.isDateRange = false;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z')
            };

            var expectedDate = {
                from: new Date('2016-01-01T14:47:00.000Z')
            };
            var convertedDate = moment(ctrl.date.from).format('MMM D, YYYY') + moment(ctrl.date.from).format(' h:mmA');

            ctrl.isShowDatePicker = true;
            ctrl.isShowOptionsList = true;
            ctrl.selectedPreset = '';
            ctrl.showOptionsList({});
            ctrl.applyChanges();

            $timeout.flush();

            expect(ctrl.displayText).toEqual(convertedDate);
            expect(ctrl.onChangeModel).toHaveBeenCalledWith({newValue: expectedDate.from, selectedPreset: ''});
        });

        it('should change ctrl.isShowOptionsList depends on range type', function () {
            ctrl.presets = {
                day: {
                    label: 'Last day',
                    getRange: function () {
                        return {
                            from: moment().subtract(1, 'days')
                        };
                    }
                }
            };
            ctrl.pickTime = true;
            ctrl.isDateRange = true;
            ctrl.isShowOptionsList = true;

            ctrl.onChangeDateTime('day');

            expect(ctrl.isShowOptionsList).toBeFalsy();
        });
    });

    describe('ctrl.applyChanges(): ', function () {
        it('should set date/time by calling ctrl.onChangeModel and close date picker', function () {
            spyOn(ctrl, 'onChangeModel');

            ctrl.pickTime = true;
            ctrl.isDateRange = true;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z'),
                to: new Date('2016-01-05T14:47:35.738Z')
            };

            var expectedDate = {
                from: new Date('2016-01-01T14:47:00.000Z'),
                to: new Date('2016-01-05T14:47:00.000Z')
            };
            var convertedDate = moment(ctrl.date.from).format('MMM D, YYYY') + moment(ctrl.date.from).format(' h:mmA') + ' - ' +
                moment(ctrl.date.to).format('MMM D, YYYY') + moment(ctrl.date.to).format(' h:mmA');

            ctrl.isShowDatePicker = true;
            ctrl.isShowOptionsList = true;
            ctrl.selectedPreset = '';

            ctrl.applyChanges();

            expect(ctrl.displayText).toEqual(convertedDate);
            expect(ctrl.onChangeModel).toHaveBeenCalledWith({newValue: expectedDate, selectedPreset: '' });
            expect(ctrl.isShowDatePicker).toBeFalsy();
            expect(ctrl.isShowOptionsList).toBeFalsy();
        });
    });

    describe('ctrl.cancelChanges(): ', function () {
        it('should cancel changes and close date picker', function () {
            ctrl.isShowDatePicker = true;
            ctrl.isShowOptionsList = true;

            ctrl.cancelChanges();

            expect(ctrl.isShowDatePicker).toBeFalsy();
            expect(ctrl.isShowOptionsList).toBeFalsy();
        });
    });

    describe('ctrl.clearSelectedDateTime(): ', function () {
        it('should clear selected date fields', function () {
            spyOn(ctrl, 'onChangeModel');
            spyOn(ctrl, 'cancelChanges');

            var defaultDatepickerOptions = {
                from: {},
                to: {}
            };
            var defaultModel = {
                newValue: {
                    to: null,
                    from: null
                },
                selectedPreset: ''
            };

            ctrl.clearSelectedDateTime();

            expect(ctrl.selectedPreset).toEqual('');
            expect(ctrl.datepickerOptions).toEqual(defaultDatepickerOptions);
            expect(ctrl.onChangeModel).toHaveBeenCalledWith(defaultModel);
            expect(ctrl.cancelChanges).toHaveBeenCalled();
        });
    });

    describe('ctrl.getErrorMessage(): ', function () {
        it('should returns \'\' if a range is correct', function () {
            ctrl.isDateRange = true;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z'),
                to: new Date('2016-01-05T14:47:35.738Z')
            };

            expect(ctrl.getErrorMessage()).toEqual('');
        });

        it('should returns \'\' if it is not date range', function () {
            ctrl.isDateRange = false;
            ctrl.date = {
                from: new Date('2016-01-01T14:47:35.738Z'),
                to: new Date('2016-01-05T14:47:35.738Z')
            };

            expect(ctrl.getErrorMessage()).toEqual('');
        });

        it('should returns error message if a range is not correct', function () {
            ctrl.isDateRange = true;
            ctrl.date = {
                from: new Date('2016-01-05T14:47:35.738Z'),
                to: new Date('2016-01-01T14:47:35.738Z')
            };

            expect(ctrl.getErrorMessage()).toEqual('ERROR_MSG.DATE_TIME_PICKER.TO_LATER_THAN_FROM');
        });
    });
});
