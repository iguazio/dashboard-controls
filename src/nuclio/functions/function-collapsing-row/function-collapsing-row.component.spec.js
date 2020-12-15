describe('nclFunctionCollapsingRow component:', function () {
    var $componentController;
    var $interval;
    var $q;
    var $rootScope;
    var $state;
    var ctrl;
    var NuclioHeaderService;
    var VersionHelperService;
    var functionItem;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$interval_, _$q_, _$rootScope_, _$state_, _NuclioHeaderService_,
            _VersionHelperService_) {
            $componentController = _$componentController_;
            $interval = _$interval_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $state = _$state_;
            NuclioHeaderService = _NuclioHeaderService_;
            VersionHelperService = _VersionHelperService_;
        });

        functionItem = {
            'metadata': {
                'name': 'functionName',
                'namespace': 'nuclio'
            },
            'spec': {
                'description': 'Some description',
                'runtime': 'golang',
                'replicas': 1,
                'build': {},
                'disable': true,
                'runRegistry': 'localhost:5000'
            },
            'status': {}
        };
        var project = {
            metadata: {
                name: 'project',
                namespace: 'nuclio'
            },
            spec: {}
        };

        var bindings = {
            project: project,
            function: functionItem,
            actionHandlerCallback: angular.noop,
            updateFunction: angular.noop,
            getFunction: angular.noop
        };

        ctrl = $componentController('nclFunctionCollapsingRow', null, bindings);

        ctrl.isSplashShowed = {
            value: false
        };

        ctrl.$onInit();

    });

    afterEach(function () {
        $componentController = null;
        $interval = null;
        $q = null;
        $rootScope = null;
        $state = null;
        ctrl = null;
        NuclioHeaderService = null;
        VersionHelperService = null;
        functionItem = null;
    });

    describe('$onInit(): ', function () {
        it('should set initial values for actions and delete function method', function () {
            expect(ctrl.function.ui.delete).not.toBeUndefined();
            expect(ctrl.actions).not.toBe([]);
        });
    });

    describe('getTooltip(): ', function () {
        it('should gets correct tooltip regarding function status', function () {
            ctrl.function.spec.disable = true;

            expect(ctrl.getTooltip()).toEqual('TOOLTIP.RUN_FUNCTION');

            ctrl.function.spec.disable = false;

            expect(ctrl.getTooltip()).toEqual('TOOLTIP.STOP_FUNCTION');
        });
    });

    describe('handleAction(): ', function () {
        it('should call actionHandlerCallback() method', function () {
            spyOn(ctrl, 'actionHandlerCallback');

            ctrl.handleAction('delete', []);
            ctrl.handleAction('export', []);

            expect(ctrl.actionHandlerCallback).toHaveBeenCalledTimes(2);
        });
    });

    describe('isFunctionShowed(): ', function () {
        it('should return true if function is showed', function () {
            ctrl.function.ui.isShowed = true;

            expect(ctrl.isFunctionShowed()).toBeTruthy();
        });
    });


    describe('onFireAction(): ', function () {
        it('should call actionHandlerCallback() method', function () {
            spyOn(ctrl, 'actionHandlerCallback');

            ctrl.onFireAction('delete');

            expect(ctrl.actionHandlerCallback).toHaveBeenCalled();
        });
    });

    describe('onSelectRow(): ', function () {
        it('should call $state.go() method and update header title', function () {
            var event = new MouseEvent('click');
            Object.defineProperty(event, 'target', {writable: false, value: {closest: angular.noop}});

            spyOn($state, 'go');
            spyOn(NuclioHeaderService, 'updateMainHeader');

            ctrl.onSelectRow(event);

            expect($state.go).toHaveBeenCalled();
            expect(NuclioHeaderService.updateMainHeader).toHaveBeenCalled();
        });
    });

    describe('toggleFunctionState(): ', function () {
        it('should toggle function state', function () {
            spyOn(ctrl, 'updateFunction').and.returnValue($q.when());

            ctrl.toggleFunctionState(new MouseEvent('click'));

            expect(ctrl.function.spec.disable).toBeFalsy();
            expect(ctrl.updateFunction).toHaveBeenCalled();
        });
    });
});
