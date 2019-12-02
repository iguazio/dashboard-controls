describe('nclProjectCollapsingRow component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var $state;
    var $timeout;
    var ngDialog;
    var ActionCheckboxAllService;
    var DialogsService;
    var ExportService;
    var ctrl;
    var functions;
    var project;
    var projectsList;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _$state_, _$timeout_, _ngDialog_,
                         _ActionCheckboxAllService_, _DialogsService_, _ExportService_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $state = _$state_;
            $timeout = _$timeout_;
            ngDialog = _ngDialog_;
            ActionCheckboxAllService = _ActionCheckboxAllService_;
            DialogsService = _DialogsService_;
            ExportService = _ExportService_;
        });

        project = {
            metadata: {
                name: 'my-project-1',
                namespace: 'nuclio'
            },
            spec: {
                description: 'Some description'
            },
            ui: {
                checked: false
            }
        };
        projectsList = [
            {
                metadata: {
                    name: 'my-project-1',
                    namespace: 'nuclio'
                },
                spec: {
                    description: 'Some description'
                },
                ui: {
                    checked: false
                }
            },
            {
                metadata: {
                    name: 'my-project-2',
                    namespace: 'nuclio'
                },
                spec: {
                    description: 'Some description'
                },
                ui: {
                    checked: false
                }
            }
        ];
        functions = [
            {
                metadata: {
                    name: 'functionName',
                    namespace: 'nuclio'
                },
                spec: {
                    description: 'Some description',
                    runtime: 'golang',
                    replicas: 1,
                    build: {},
                    runRegistry: 'localhost:5000'
                }
            }
        ];
        var bindings = {
            project: project,
            projectsList: angular.copy(projectsList),
            deleteProject: $q.when.bind($q),
            getFunctions: angular.noop,
            projectActionHandlerCallback: angular.noop
        };

        ctrl = $componentController('nclProjectCollapsingRow', null, bindings);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        $state = null;
        $timeout = null;
        ngDialog = null;
        ctrl = null;
        functions = null;
        ActionCheckboxAllService = null;
        DialogsService = null;
        ExportService = null;
    });

    describe('$onInit(): ', function () {
        it('should initialize `checked` status to `false`', function () {
            expect(ctrl.project.ui.checked).toBeFalsy();
        });

        it('should initialize project actions and their handlers', function () {
            expect(ctrl.project.ui['expand-all']).toBeDefined();
            expect(ctrl.project.ui['collapse-all']).toBeDefined();
            expect(ctrl.project.ui['delete']).toBeDefined();
            expect(ctrl.project.ui['edit']).toBeDefined();
            expect(ctrl.project.ui['export']).toBeDefined();
            expect(ctrl.projectActions).not.toBe({});
        });
    });

    describe('collapseAll(): ', function () {
        it('should send `collapse-all-rows` broadcast', function () {
            spyOn($rootScope, '$broadcast').and.callThrough();

            ctrl.project.ui['collapse-all']();
            $rootScope.$digest();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('collapse-all-rows', {
                rowsType: 'functions',
                onlyForProject: ctrl.project
            });
        });
    });

    describe('deleteProject(): ', function () {
        it('should resolve `ctrl.deleteProject()` method if there is error ' +
            '(missing mandatory fields) is response', function () {
            spyOn(ctrl, 'deleteProject').and.callThrough();

            ctrl.project.ui.delete();
            $rootScope.$digest();
            project.ui = ctrl.project.ui;

            expect(ctrl.deleteProject).toHaveBeenCalledWith({ project: ctrl.project });
        });

        // todo error status cases
        it('should resolve `ctrl.deleteProject()` method if there is error ' +
            '(missing mandatory fields) is response', function () {
            spyOn(ctrl, 'deleteProject').and.returnValue($q.reject());

            ctrl.project.ui.delete();
            $rootScope.$digest();
            project.ui = ctrl.project.ui;

            expect(ctrl.deleteProject).toHaveBeenCalledWith({ project: ctrl.project });
        });
    });

    describe('editProject(): ', function () {
        it('should call ngDialog.open() method', function () {
            spyOn(ngDialog, 'open').and.returnValue({ closePromise: $q.when() });

            ctrl.project.ui.edit();

            expect(ngDialog.open).toHaveBeenCalled();
        })
    });

    describe('expandAll(): ', function () {
        it('should send `expand-all-rows` broadcast', function () {
            spyOn($rootScope, '$broadcast').and.callThrough();

            ctrl.project.ui['expand-all']();
            $rootScope.$digest();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('expand-all-rows', {
                rowsType: 'functions',
                onlyForProject: ctrl.project
            });
        });
    });

    describe('exportProject(): ', function () {
        it('should call ExportService.exportProject() method', function () {
            spyOn(ExportService, 'exportProject');

            ctrl.project.ui.export();

            expect(ExportService.exportProject).toHaveBeenCalledWith(ctrl.project, ctrl.getFunctions);
        });
    });

    describe('isProjectEmpty(): ', function () {
        it('should return true if the project contains empty functions list', function () {
            ctrl.project.ui.functions = [];

            expect(ctrl.isProjectEmpty()).toBeTruthy();
        });

        it('should return false if the project contains not empty functions list', function () {
            ctrl.project.ui.functions = functions;

            expect(ctrl.isProjectEmpty()).toBeFalsy();
        });
    });

    describe('onFireAction(): ', function () {
        it('should call projectActionHandlerCallback() method', function () {
            spyOn(ctrl, 'projectActionHandlerCallback');

            ctrl.onFireAction('delete');
            ctrl.onFireAction('edit');
            ctrl.onFireAction('export');

            expect(ctrl.projectActionHandlerCallback).toHaveBeenCalledTimes(3);
        });
    });

    describe('onSelectRow(): ', function () {
        it('should call $state.go() method', function () {
            spyOn($state, 'go');

            ctrl.onSelectRow(new MouseEvent('click'));

            expect($state.go).toHaveBeenCalled();
        });
    });

    describe('toggleProjectRow(): ', function () {
        it('should toggle project row collapsing state', function () {
            ctrl.isProjectCollapsed = false;

            ctrl.toggleProjectRow();
            $timeout.flush();

            expect(ctrl.isProjectCollapsed).toBeTruthy();
        });
    });
});
