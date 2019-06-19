describe('igzSliderInputBlock component', function () {
    var $componentController;
    var $rootScope;
    var mockedConverterService;
    var ctrl;
    var units = [
        {
            pow: 1,
            name: 'KB/s'
        },
        {
            pow: 2,
            name: 'MB/s'
        },
        {
            pow: 3,
            name: 'GB/s'
        }
    ];

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        // load needed services
        inject(function (_$componentController_, _$rootScope_, _ConverterService_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            mockedConverterService = _ConverterService_;
        });

        var sliderConfig = {
            name: 'Read BW',
            value: 0,
            valueLabel: '',
            pow: 0,
            unitLabel: '',
            iconType: 'read',
            options: {
                floor: 1,
                id: 'access_limits_bandwidth_read',
                ceil: 1025,
                showSelectionBar: true,
                onChange: null,
                onEnd: null
            }
        };
        var bindings = {
            sliderConfig: sliderConfig,
            sliderBlockUpdatingBroadcast: 'data-access-policy-rule_select'
        };
        var element = '<igz-slider-input-block></igz-slider-input-block>';

        ctrl = $componentController('igzSliderInputBlock', {$element: element}, bindings);
        ctrl.$onInit();

        // create broadcast to set data in component scope
        $rootScope.$broadcast('data-access-policy-rule_select', {
            item: {
                attr: {
                    access_limits_bandwidth_read: 157286400
                }
            },
            id: 'containerAccessControl.data.ui.children[0]'
        });
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        mockedConverterService = null;
        ctrl = null;
    });

    describe('onInit(): ', function () {
        it('should set default units` values', function () {
            expect(ctrl.measureUnits[0].pow).toEqual(units[0].pow);
            expect(ctrl.measureUnits[0].name).toEqual(units[0].name);
        });
    });

    describe('changeTrafficUnit(): ', function () {
        var kbUnit = units[0];

        beforeEach(function () {
            ctrl.changeTrafficUnit(kbUnit);
        });

        it('should set correct unit label', function () {
            expect(ctrl.sliderConfig.unitLabel).toBe(kbUnit.name);
        });

        it('should set correct pow', function () {
            expect(ctrl.sliderConfig.pow).toBe(kbUnit.pow);
        });
    });
});
