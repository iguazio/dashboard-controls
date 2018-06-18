describe('nclBreadcrumbsDropdown component:', function () {
    var $componentController;
    var $rootScope;
    var $state;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$state_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $state = _$state_;
        });

        var element = angular.element('<igz-breadcrumbs-dropdown></igz-breadcrumbs-dropdown>');

        ctrl = $componentController('nclBreadcrumbsDropdown', {$element: element});
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $state = null;
        ctrl = null;
    });

    describe('ctrl.showDropdown(): ', function () {
        it('should open dropdown', function () {
            ctrl.showDropdownList = false;

            ctrl.showDropdown();

            expect(ctrl.showDropdownList).toBeTruthy();
        });

        it('should close dropdown', function () {
            ctrl.showDropdownList = true;
            ctrl.searchText = 'some text';

            ctrl.showDropdown();

            expect(ctrl.showDropdownList).toBeFalsy();
            expect(ctrl.searchText).toEqual('');
        });
    });

    describe('ctrl.showDetails(): ', function () {
        it('should show details of clicked item', function () {
            spyOn($state, 'go').and.callThrough();

            ctrl.showDropdownList = true;
            ctrl.searchText = 'some text';
            ctrl.type = 'functions';
            ctrl.project = {
                metadata: {
                    name: 'project',
                    namespace: 'nuclio'
                },
                spec: {}
            };

            ctrl.showDetails({}, {id: 'id'});

            $rootScope.$digest();

            expect(ctrl.showDropdownList).toBeFalsy();
            expect(ctrl.searchText).toEqual('');
            expect($state.go).toHaveBeenCalledWith('app.project.function.edit.code', {
                isNewFunction: false,
                id: 'project',
                functionId: 'id',
                projectNamespace: 'nuclio'
            });
        });
    });
});
