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
describe('nclBreadcrumbsDropdown component:', function () {
    var $componentController;
    var $httpBackend;
    var $rootScope;
    var $state;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$httpBackend_, _$rootScope_, _$state_) {
            $componentController = _$componentController_;
            $httpBackend = _$httpBackend_;
            $rootScope = _$rootScope_;
            $state = _$state_;
        });

        var element = angular.element('<igz-breadcrumbs-dropdown></igz-breadcrumbs-dropdown>');

        $httpBackend
            .whenGET('views/app/main.tpl.html')
            .respond(200, {});

        ctrl = $componentController('nclBreadcrumbsDropdown', {$element: element});
    });

    afterEach(function () {
        $componentController = null;
        $httpBackend = null;
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
            spyOn($state, 'go');

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
