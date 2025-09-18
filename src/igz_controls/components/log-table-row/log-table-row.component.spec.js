describe('igzElasticLogTableRow component: ', function () {
    var $componentController;
    var $rootScope;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$rootScope_, _$componentController_) {
            $rootScope = _$rootScope_;
            $componentController = _$componentController_;

            var binding = {
                entryItem: {
                    time: new Date,
                    level: 'info',
                    name: 'cron',
                    message: 'message',
                    more: 'message 2'
                }
            };

            ctrl = $componentController('igzElasticLogTableRow', null, binding);
        });
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('getLogLevel():', function () {
        it('should return the log level display value', function () {
            expect(ctrl.getLogLevel()).toBe('I');
        });
    });

    describe('getLogName():', function () {
        it('should return the full log name display value', function () {
            ctrl.entryItem.name = '012345678901234567890123456789';
            expect(ctrl.getLogName()).toBe('012345678901234567890123456789');
        });
    });

    describe('getLogTrimmedName():', function () {

        it('should return the log name display value with free space in the end, 25 symbols in total', function () {
            expect(ctrl.getLogTrimmedName()).toBe('cron                     ');
        });

        it('should return the cropped log name display value to 25 symbols', function () {
            ctrl.entryItem.name = '012345678901234567890123456789123456789';
            expect(ctrl.getLogTrimmedName()).toBe('0123456789012345678901234');
        });
    });
});
