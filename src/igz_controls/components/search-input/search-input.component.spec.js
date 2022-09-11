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
describe('igzSearchInput Component:', function () {
    var $componentController;
    var $rootScope;
    var $timeout;
    var SearchHelperService;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$timeout_, _SearchHelperService_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            SearchHelperService = _SearchHelperService_;
        });

        var bindings = {
            searchStates: {},
            searchKeys: ['attr.name'],
            dataSet: [
                {
                    attr: {
                        name: '1'
                    },
                    ui: {
                        children: ''
                    }
                },
                {
                    attr: {
                        name: '2'
                    },
                    ui: {
                        children: ''
                    }
                },
                {
                    attr: {
                        name: '3'
                    },
                    ui: {
                        children: ''
                    }
                }
            ]
        };

        ctrl = $componentController('igzSearchInput', null, bindings);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $timeout = null;
        SearchHelperService = null;
        ctrl = null;
    });

    describe('onPressEnter()', function () {
        it('should called onPressEnter', function () {
            spyOn(ctrl, 'onPressEnter');
            ctrl.onPressEnter();

            expect(ctrl.onPressEnter).toHaveBeenCalled();
        });
        it('should call makeSearch() method', function () {
            var e = {keyCode: 13};
            spyOn(SearchHelperService, 'makeSearch');
            ctrl.onPressEnter(e);

            expect(SearchHelperService.makeSearch).toHaveBeenCalled();
        });
    });

    describe('onChangeSearchQuery()', function () {
        it('should call makeSearch() after changing searchQuery', function () {
            spyOn(SearchHelperService, 'makeSearch');
            $rootScope.$digest();

            ctrl.searchQuery = 'new';
            $rootScope.$digest();

            $timeout(function () {
                expect(SearchHelperService.makeSearch).toHaveBeenCalled();
            });
            $timeout.flush();
        });
    });

    describe('onDataChanged()', function () {
        it('should call makeSearch() after sending broadcast', function () {
            spyOn(SearchHelperService, 'makeSearch');
            $rootScope.$broadcast('search-input_refresh-search');

            $timeout(function () {
                expect(SearchHelperService.makeSearch).toHaveBeenCalled();
            });
            $timeout.flush();
        });
    });

    describe('resetSearch()', function () {
        it('should call makeSearch() after sending broadcast', function () {
            spyOn(SearchHelperService, 'makeSearch');
            $rootScope.$broadcast('search-input_reset');

            $timeout(function () {
                expect(SearchHelperService.makeSearch).toHaveBeenCalled();
            });
            $timeout.flush();
        });
    });

    describe('clearInputField()', function () {
       it('should empty search field after call clearInputField()', function () {
           ctrl.searchQuery = 'new';
           ctrl.clearInputField();
           expect(ctrl.searchQuery).toEqual('');
       });
    });
});