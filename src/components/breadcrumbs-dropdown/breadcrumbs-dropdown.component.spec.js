describe('igzBreadcrumbsDropdown component:', function () {
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

        ctrl = $componentController('igzBreadcrumbsDropdown', {$element: element});
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
            spyOn($rootScope, '$broadcast').and.callThrough();
            spyOn($state, 'go').and.callThrough();

            ctrl.showDropdownList = true;
            ctrl.searchText = 'some text';
            ctrl.state = 'app.containers';

            ctrl.showDetails({}, {id: 'id'});

            expect(ctrl.showDropdownList).toBeFalsy();
            expect(ctrl.searchText).toEqual('');
            expect($rootScope.$broadcast).toHaveBeenCalledWith('statistics-data_abort-requests');
            expect($state.go).toHaveBeenCalledWith('app.containers', {id: 'id'});
        });
    });
});
