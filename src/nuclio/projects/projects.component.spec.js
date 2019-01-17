describe('nclProjects component: ', function () {
    var $componentController;
    var $rootScope;
    var $q;
    var ngDialog;
    var ExportService;
    var ctrl;
    var projects;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$rootScope_, _$componentController_, _$q_, _ngDialog_, _ExportService_) {
            $rootScope = _$rootScope_;
            $componentController = _$componentController_;
            $q = _$q_;
            ngDialog = _ngDialog_;
            ExportService = _ExportService_;

            projects = [
                {
                    metadata: {
                        name: 'my-project-1',
                        namespace: 'nuclio'
                    },
                    spec: {
                        displayName: 'My project #1',
                        description: 'Some description'
                    },
                    ui: {
                        checked: false,
                        delete: angular.noop
                    }
                },
                {
                    metadata: {
                        name: 'my-project-2',
                        namespace: 'nuclio'
                    },
                    spec: {
                        displayName: 'My project #2',
                        description: 'Some description'
                    },
                    ui: {
                        checked: false,
                        delete: angular.noop
                    }
                }
            ];
            var bindings = {
                projects: projects,
                getProjects: $q.when.bind($q),
                getFunctions: $q.when.bind($q)
            };
            var element = angular.element('<ncl-projects></ncl-projects>');
            var ImportService = {
                importService: null
            };

            ctrl = $componentController('nclProjects', {$element: element, ImportService: ImportService}, bindings);
            ctrl.$onInit();
            $rootScope.$digest();
        });
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $q = null;
        ngDialog = null;
        ctrl = null;
    });

    describe('$onInit(): ', function () {
        it('should initialize projects actions array', function () {
            var expectedActions = [
                {
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
                },
                {
                    label: 'Edit',
                    id: 'edit',
                    icon: 'igz-icon-properties',
                    active: true
                },
                {
                    label: 'Export',
                    id: 'export',
                    icon: 'igz-icon-export-yml',
                    active: true
                }
            ];

            expect(ctrl.actions).toEqual(expectedActions);
        });

        it('should initialize projects array', function () {
            expect(ctrl.projects).toEqual(projects);
        });

        it('should call onFireAction() method if `action-panel_fire-action` broadcast was sent', function () {
            spyOn(ctrl, 'handleAction');

            var data = {
                action: {
                    label: 'Edit',
                    id: 'edit',
                    icon: 'igz-icon-properties',
                    active: true
                }
            };
            ctrl.projects[0].ui = {
                checked: true
            };
            projects[0].ui = ctrl.projects[0].ui;

            $rootScope.$broadcast('action-panel_fire-action', data);

            $rootScope.$digest();

            expect(ctrl.handleAction).toHaveBeenCalledWith(data.action, [projects[0]]);
        });
    });

    describe('$onDestroy(): ', function () {
        it('should close opened ngDialog', function () {
            spyOn(ngDialog, 'close');

            ctrl.$onDestroy();

            expect(ngDialog.close).toHaveBeenCalled();
        });
    });

    describe('handleAction(): ', function () {
        it('should call action\'s handlers for all checked projects', function () {
            var mockedValue = {
                then: function () {
                    return {
                        'catch': angular.noop
                    }
                }
            };
            ctrl.projects[1].ui.checked = true;
            projects[1].ui = ctrl.projects[1].ui;

            spyOn(ctrl.projects[0].ui, 'delete').and.returnValue(mockedValue);
            spyOn(ctrl.projects[1].ui, 'delete').and.returnValue(mockedValue);

            ctrl.handleAction('delete', [ctrl.projects[0], ctrl.projects[1]]);

            expect(ctrl.projects[0].ui.delete).toHaveBeenCalled();
            expect(ctrl.projects[1].ui.delete).toHaveBeenCalled();
        });
    });

    describe('openNewProjectDialog(): ', function () {
        it('should open ngDialog and get project list', function () {
            spyOn(ctrl, 'getProjects').and.callThrough();
            spyOn(ngDialog, 'open').and.returnValue({
                closePromise: $q.when({
                    value: 'some-value'
                })
            });

            ctrl.openNewProjectDialog();
            $rootScope.$digest();

            expect(ngDialog.open).toHaveBeenCalled();
            expect(ctrl.getProjects).toHaveBeenCalled();
        });
    });

    describe('refreshProjects(): ', function () {
        it('should change value of `ctrl.isFiltersShowed` and call `ctrl.getProjects()`', function () {
            spyOn(ctrl, 'getProjects').and.callThrough();

            ctrl.refreshProjects();
            $rootScope.$digest();

            expect(ctrl.getProjects).toHaveBeenCalled();
        });
    });

    describe('toggleFilters(): ', function () {
        it('should change value of `ctrl.isFiltersShowed`', function () {
            ctrl.isFiltersShowed.value = false;

            ctrl.toggleFilters();

            expect(ctrl.isFiltersShowed.value).toBeTruthy();

            ctrl.toggleFilters();

            expect(ctrl.isFiltersShowed.value).toBeFalsy();
        });
    });

    describe('onSelectDropdownAction(): ', function () {
        it('should call `onSelectDropdown` function', function () {
            spyOn(ctrl, 'onSelectDropdownAction');

            ctrl.onSelectDropdownAction({id: 'exportProjects'});

            expect(ctrl.onSelectDropdownAction).toHaveBeenCalled();
        });

        it('should call `exportProject` handler', function () {
            spyOn(ExportService, 'exportProjects');

            ctrl.onSelectDropdownAction({id: 'exportProjects'});

            expect(ExportService.exportProjects).toHaveBeenCalledWith(jasmine.arrayContaining([jasmine.objectContaining({
                metadata: jasmine.objectContaining({
                    name: jasmine.any(String)
                }),
                spec: jasmine.objectContaining({
                    displayName: jasmine.any(String)
                })
            })]), jasmine.any(Function));
        });
    });
});
