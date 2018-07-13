/* eslint max-statements: ["error", 100] */
/* eslint complexity: ["error", 11] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionEventPane', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/function-event-pane.tpl.html',
            controller: NclFunctionEventPaneController
        });

    function NclFunctionEventPaneController($element, $rootScope, $timeout, $q, lodash, moment, download, ConvertorService,
                                            DialogsService, EventHelperService, NuclioEventService, VersionHelperService) {
        var ctrl = this;

        var canceller = $q.defer();
        var HISTORY_LIMIT = 100;

        ctrl.createEvent = true;
        ctrl.headers = [];
        ctrl.isSplashShowed = {
            value: false
        };
        ctrl.leftBarNavigationTabs = [
            {
                id: 'saved',
                tabName: 'Saved'
            },
            {
                id: 'history',
                tabName: 'History'
            }
        ];
        ctrl.logs = [];
        ctrl.requestMethods = [
            {
                id: 'post',
                name: 'POST',
                visible: true
            },
            {
                id: 'get',
                name: 'GET',
                visible: true
            },
            {
                id: 'put',
                name: 'PUT',
                visible: true
            },
            {
                id: 'gelete',
                name: 'DELETE',
                visible: true
            },
            {
                id: 'patch',
                name: 'PATCH',
                visible: true
            }
        ];
        ctrl.requestNavigationTabs = [
            {
                id: 'body',
                tabName: 'Body'
            },
            {
                id: 'headers',
                tabName: 'Headers'
            }
        ];
        ctrl.requestBodyTypes = [
            {
                id: 'text',
                name: 'Text',
                visible: true
            },
            {
                id: 'json',
                name: 'JSON',
                visible: true
            },
            {
                id: 'file',
                name: 'File',
                visible: true
            }
        ];
        ctrl.requestBodyType = ctrl.requestBodyTypes[0];
        ctrl.requestSourceCodeLanguage = 'plaintext';
        ctrl.requestSourceCode = '';
        ctrl.responseNavigationTabs = [
            {
                id: 'body',
                tabName: 'Body'
            },
            {
                id: 'headers',
                tabName: 'Headers',
                badge: 0
            },
            {
                id: 'logs',
                tabName: 'Logs',
                badge: 0
            }
        ];
        ctrl.responseImage = null;
        ctrl.selectedEvent = {};
        ctrl.selectedRequestTab = ctrl.responseNavigationTabs[0];
        ctrl.selectedResponseTab = ctrl.responseNavigationTabs[0];
        ctrl.selectedLeftBarTab = ctrl.leftBarNavigationTabs[0];
        ctrl.showLeftBar = false;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.testResult = {};
        ctrl.uploadingData = {
            uploading: false,
            uploaded: false,
            progress: '0%',
            name: ''
        };

        ctrl.$onInit = onInit;

        ctrl.addNewHeader = addNewHeader;
        ctrl.cancelInvocation = cancelInvocation;
        ctrl.closeLeftBar = closeLeftBar;
        ctrl.copyToClipboard = copyToClipboard;
        ctrl.downloadResponseFile = downloadResponseFile;
        ctrl.deleteEvent = deleteEvent;
        ctrl.deleteFile = deleteFile;
        ctrl.fixLeftBar = fixLeftBar;
        ctrl.getInvocationUrl = getInvocationUrl;
        ctrl.getMethodColor = getMethodColor;
        ctrl.handleAction = handleAction;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isDisabledTestButton = isDisabledTestButton;
        ctrl.onChangeData = onChangeData;
        ctrl.onChangeRequestMethod = onChangeRequestMethod;
        ctrl.onChangeTab = onChangeTab;
        ctrl.onChangeRequestBodyType = onChangeRequestBodyType;
        ctrl.onChangeRequestSourceCode = onChangeRequestSourceCode;
        ctrl.resetData = resetData;
        ctrl.saveEvent = saveEvent;
        ctrl.selectEvent = selectEvent;
        ctrl.testEvent = testEvent;
        ctrl.uploadFile = uploadFile;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isSplashShowed.value = true;

            if (lodash.isNil(ctrl.version.ui.deployedVersion)) {
                VersionHelperService.checkVersionChange(ctrl.version);
            }

            ctrl.history = lodash.defaultTo(angular.fromJson(localStorage.getItem('test-events')), []);

            lodash.defaultsDeep(ctrl.selectedEvent, {
                metadata: {
                    namespace: lodash.get(ctrl.version, 'metadata.namespace'),
                    labels: {
                        'nuclio.io/function-name': lodash.get(ctrl.version, 'metadata.name')
                    }
                },
                spec: {
                    displayName: '',
                    triggerKind: 'http',
                    attributes: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain',
                            'x-nuclio-path': '',
                            'x-nuclio-invoke-via': 'external-ip',
                            'x-nuclio-log-level': 'debug'
                        }
                    },
                    body: ''
                }
            });

            NuclioEventService.getEvents(ctrl.version).then(function (response) {
                ctrl.savedEvents = lodash.values(response.data);

                ctrl.isSplashShowed.value = false;
            }).catch(function () {
                DialogsService.alert('Oops: Unknown error occurred while retrieving events');

                ctrl.isSplashShowed.value = false;
            });

            ctrl.path = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers[\'x-nuclio-path\']');

            updateRequestHeaders();
        }

        //
        // Public methods
        //

        /**
         * Adds new header
         */
        function addNewHeader(event) {
            $timeout(function () {
                if (ctrl.headers.length < 1 || lodash.last(ctrl.headers).ui.isFormValid) {
                    ctrl.headers.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'header',
                            checked: true
                        }
                    });

                    event.stopPropagation();
                }
            }, 50);
        }

        /**
         * Cancels invoke request
         */
        function cancelInvocation() {
            canceller.resolve();
        }

        /**
         * Closes left bar
         */
        function closeLeftBar() {
            ctrl.showLeftBar = false;
            ctrl.fixedLeftBar = false;
        }

        /**
         * Copies a string to the clipboard. Must be called from within an event handler such as click
         */
        function copyToClipboard() {
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = ctrl.testResult.body;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();

                try {
                    return document.execCommand('copy'); // Security exception may be thrown by some browsers.
                } catch (ex) {
                    DialogsService.alert('Copy to clipboard failed.', ex);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }

        /**
         * Downloads response body file
         */
        function downloadResponseFile() {
            var fileName = ctrl.selectedEvent.spec.displayName + '_' + moment.utc().format('YYYY-MM-DDThh-mm-ss');
            var textualFile = lodash.startsWith(ctrl.testResult.headers['content-type'], 'text/') ||
                              ctrl.testResult.headers['content-type'] === 'application/json';

            if (textualFile) {
                download.fromData(ctrl.testResult.body, ctrl.testResult.headers['content-type'], fileName);
            } else {
                download.fromBlob(ctrl.testResult.body, fileName);
            }
        }

        /**
         * Deletes selected event
         * @param {Object} event
         */
        function deleteEvent(event) {
            var dialogConfig = {
                message: {
                    message: 'Delete event “' + event.spec.displayName + '”?',
                    description: 'Deleted event cannot be restored.'
                },
                yesLabel: 'Yes, Delete',
                noLabel: 'Cancel',
                type: 'nuclio_alert'
            };

            DialogsService.confirm(dialogConfig.message, dialogConfig.yesLabel, dialogConfig.noLabel, dialogConfig.type)
                .then(function () {
                    var eventData = {
                        metadata: {
                            name: event.metadata.name,
                            namespace: event.metadata.namespace
                        }
                    };
                    ctrl.isSplashShowed.value = true;

                    NuclioEventService.deleteEvent(eventData)
                        .then(function () {

                            // update test events list
                            NuclioEventService.getEvents(ctrl.version)
                                .then(function (response) {
                                    ctrl.savedEvents = lodash.values(response.data);

                                    if (event.metadata.name === ctrl.selectedEvent.metadata.name) {
                                        resetData();
                                    }

                                    ctrl.isSplashShowed.value = false;
                                })
                                .catch(function () {
                                    DialogsService.alert('Oops: Unknown error occurred while retrieving events');

                                    ctrl.isSplashShowed.value = false;
                                });
                        })
                        .catch(function () {
                            DialogsService.alert('Oops: Unknown error occurred while deleting event');

                            ctrl.isSplashShowed.value = false;
                        });
                });
        }

        /**
         * Deletes uploaded file
         */
        function deleteFile() {
            ctrl.uploadingData = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                name: ''
            };

            ctrl.selectedEvent.spec.body = '';
            ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = '';

            updateRequestHeaders();
        }

        /**
         * Sets left bar as fixed
         */
        function fixLeftBar() {
            ctrl.fixedLeftBar = true;
        }

        /**
         * Gets invocation url
         * @returns {string}
         */
        function getInvocationUrl() {
            var httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            return lodash.isNull(httpPort) ? 'Not yet deployed' : ctrl.version.ui.invocationURL;
        }

        /**
         * Gets color depends on request method type
         * @param {string} method
         * @returns {string}
         */
        function getMethodColor(method) {
            return method === 'POST'    ? '#fdbc5a' :
                   method === 'GET'     ? '#21d4ac' :
                   method === 'PUT'     ? '#239bca' :
                   method === 'DELETE'  ? '#e54158' : '#96a8d3';
        }

        /**
         * Handler on specific action type for key-value input
         * @param {string} actionType
         * @param {number} index - index of label in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.headers.splice(index, 1);

                updateHeaders();
            }
        }

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.headers.length > 5;
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.selectedEvent, field, newData);

            updateRequestHeaders();
        }

        /**
         * Checks if `Test` button should be disabled
         * @returns {boolean}
         */
        function isDisabledTestButton() {
            var httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            return lodash.isNull(httpPort) || ctrl.uploadingData.uploading || ctrl.testing;
        }

        /**
         * Changes headers data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.headers[index] = label;

            updateHeaders();
        }

        /**
         * Changes request`s source code
         * @param {string} sourceCode
         */
        function onChangeRequestSourceCode(sourceCode) {
            lodash.set(ctrl.selectedEvent, 'spec.body', sourceCode);
        }

        /**
         * Changes function`s test request method
         * @param {Object} requestMethod
         */
        function onChangeRequestMethod(requestMethod) {
            lodash.set(ctrl.selectedEvent, 'spec.attributes.method', requestMethod.name);
        }

        /**
         * Changes function`s test tab
         * @param {Object} tab
         * @param {string} field
         */
        function onChangeTab(tab, field) {
            ctrl[field] = tab;
        }

        /**
         * Changes function`s test request type of body (text, json, file)
         * @param {Object} bodyType
         */
        function onChangeRequestBodyType(bodyType) {
            ctrl.requestBodyType = bodyType;

            if (bodyType.id === 'file') {
                ctrl.selectedEvent.spec.body = '';

                $timeout(onDragNDropFileToBody);
            } else {
                ctrl.uploadingData = {
                    uploading: false,
                    uploaded: false,
                    progress: '0%',
                    name: ''
                };

                ctrl.requestSourceCodeLanguage = bodyType.id === 'json' ? 'json' : 'textplain';
                ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = bodyType.id === 'json' ? 'application/json' : 'text/plain';

                updateRequestHeaders();
            }
        }

        /**
         * Resets all changes
         */
        function resetData() {
            ctrl.selectedEvent = {
                metadata: {
                    namespace: lodash.get(ctrl.version, 'metadata.namespace'),
                    labels: {
                        'nuclio.io/function-name': lodash.get(ctrl.version, 'metadata.name')
                    }
                },
                spec: {
                    displayName: '',
                    triggerKind: 'http',
                    attributes: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain',
                            'x-nuclio-path': '',
                            'x-nuclio-invoke-via': 'external-ip',
                            'x-nuclio-log-level': 'debug'
                        }
                    },
                    body: ''
                }
            };
            ctrl.createEvent = true;
            ctrl.testResult = null;

            ctrl.requestBodyType = ctrl.requestBodyTypes[0];
            ctrl.headers = null;

            updateRequestHeaders();
            $rootScope.$broadcast('monaco_on-change-content', {code: ctrl.selectedEvent.spec.body, language: ctrl.requestSourceCodeLanguage, name: 'eventRequestBody'});
        }

        /**
         * Saves created event
         * @param {Object} event
         */
        function saveEvent(event) {
            ctrl.headersForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                (ctrl.headersForm.$valid)) {

                var eventToSave = angular.copy(ctrl.selectedEvent);
                if (ctrl.requestBodyType === 'file') {
                    eventToSave.spec.body = '';
                }

                ctrl.isSplashShowed.value = true;

                // save created event on beck-end
                NuclioEventService.deployEvent(eventToSave, ctrl.createEvent)
                    .then(function (res) {
                        NuclioEventService.getEvents(ctrl.version).then(function (response) {
                            ctrl.savedEvents = lodash.values(response.data);
                        });

                        if (ctrl.createEvent) {
                            ctrl.selectedEvent = res.data;
                        }

                        ctrl.createEvent = false;
                        ctrl.isSplashShowed.value = false;
                    })
                    .catch(function () {
                        DialogsService.alert('Error occurred while creating/updating the new function event.');
                        ctrl.isSplashShowed.value = false;
                    });
            }
        }

        /**
         * Selects specific event from list of saved events
         * @param {Object} event
         */
        function selectEvent(event) {
            ctrl.selectedEvent = angular.copy(event);
            ctrl.selectedEvent.spec.body = lodash.defaultTo(ctrl.selectedEvent.spec.body, '');
            ctrl.createEvent = false;
            ctrl.testResult = null;
            ctrl.showLeftBar = ctrl.fixedLeftBar;

            var contentType = ctrl.selectedEvent.spec.attributes.headers['Content-Type'];
            ctrl.requestSourceCodeLanguage = contentType === 'application/json' ? 'json' : 'textplain';
            updateRequestHeaders();

            $rootScope.$broadcast('monaco_on-change-content', {code: ctrl.selectedEvent.spec.body, language: ctrl.requestSourceCodeLanguage, name: 'eventRequestBody'});

            var requestType = contentType === 'application/json' ? 'json' :
                              contentType === 'text/plain'       ? 'text' : 'file';
            ctrl.requestBodyType = lodash.find(ctrl.requestBodyTypes, ['id', requestType]);
        }

        /**
         * Invokes event
         * @param {Object} event
         */
        function testEvent(event) {
            var httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            ctrl.headersForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                ctrl.headersForm.$valid && !lodash.isNull(httpPort) && !ctrl.uploadingData.uploading && !ctrl.testing) {
                var startTime = moment();
                canceller = $q.defer();
                ctrl.testing = true;
                ctrl.testResult = {};
                ctrl.responseImage = null;

                NuclioEventService.invokeFunction(ctrl.selectedEvent, canceller)
                    .then(function (response) {
                        return $q.reject(response);
                    })
                    .catch(function (invocationData) {
                        if (invocationData.status !== -1) {
                            ctrl.invokeTime = convertTime(moment().diff(startTime));

                            ctrl.testResult = {
                                status: {
                                    state: invocationData.xhrStatus,
                                    statusCode: invocationData.status,
                                    statusText: invocationData.statusText
                                },
                                headers: lodash.omit(invocationData.headers(), 'x-nuclio-logs'),
                                body: invocationData.data
                            };

                            if (ctrl.testResult.headers['content-type'] === 'application/json' && lodash.isObject(invocationData.data)) {
                                ctrl.testResult.body = angular.toJson(angular.fromJson(ctrl.testResult.body), ' ', 4);
                            }

                            var responseHeadersTab = lodash.find(ctrl.responseNavigationTabs, ['id', 'headers']);
                            responseHeadersTab.badge = lodash.size(ctrl.testResult.headers);

                            if (ctrl.history.length === HISTORY_LIMIT) {
                                ctrl.history.splice(0, 1);
                            }
                            ctrl.history.push({
                                method: ctrl.selectedEvent.spec.attributes.method,
                                path: ctrl.selectedEvent.spec.attributes.headers['x-nuclio-path']
                            });
                            localStorage.setItem('test-events', angular.toJson(ctrl.history));

                            var logs = lodash.get(invocationData.headers(), 'x-nuclio-logs', null);
                            var responseLogsTab = lodash.find(ctrl.responseNavigationTabs, ['id', 'logs']);
                            ctrl.logs = lodash.isNull(logs) ? [] : angular.fromJson(logs);
                            responseLogsTab.badge = ctrl.logs.length;

                            var size = lodash.get(ctrl.testResult.headers, 'content-length', null);
                            ctrl.responseSize = lodash.isNull(size) ? size : ConvertorService.getConvertedBytes(size, ['B', 'KB', 'MB', 'GB']);

                            var textualFile = lodash.startsWith(ctrl.testResult.headers['content-type'], 'text/') ||
                                ctrl.testResult.headers['content-type'] === 'application/json';
                            var imageFile = lodash.startsWith(ctrl.testResult.headers['content-type'], 'image/');
                            ctrl.responseBodyType = textualFile ? 'code'  :
                                                    imageFile   ? 'image' : 'N/A';

                            if (textualFile) {
                                $rootScope.$broadcast('monaco_on-change-content', {
                                    code: ctrl.testResult.body,
                                    language: 'plaintext',
                                    name: 'eventResponseBody'
                                });

                                ctrl.testing = false;
                            } else if (imageFile) {
                                var reader = new FileReader();
                                reader.readAsDataURL(ctrl.testResult.body);
                                reader.onload = function () {
                                    ctrl.responseImage = reader.result;
                                    ctrl.testing = false;
                                }
                            } else {
                                ctrl.testing = false;
                            }
                        } else {
                            ctrl.testing = false;
                            DialogsService.alert('Oops: Error occurred while invoking. Status: ' + invocationData.xhrStatus);
                        }

                        ctrl.isInvocationSuccess = lodash.startsWith(invocationData.status, '2');
                    });
            }
        }

        /**
         * Upload selected file
         * @param {Object} file - selected file
         */
        function uploadFile(file) {
            var reader = new FileReader();
            var size = ConvertorService.getConvertedBytes(file.size, ['B', 'KB', 'MB', 'GB']);

            ctrl.uploadingData.size = size.value + size.label;
            ctrl.uploadingData.name = file.name;

            reader.onload = function (onloadEvent) {
                if (!ctrl.uploadingData.uploaded) {
                    ctrl.uploadingData.uploading = false;
                    ctrl.uploadingData.uploaded = true;
                    ctrl.uploadingData.name = file.name;
                    ctrl.uploadingData.progress = '100%';

                    if (onloadEvent.target.result === '') {
                        DialogsService.alert('Oops: Unknown error occurred while uploading a file');

                        deleteFile();
                    } else {
                        ctrl.selectedEvent.spec.body = b64toBlob(onloadEvent.target.result.split(',')[1], file.type);

                        ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = file.type;
                        updateRequestHeaders();
                    }
                }
            };
            reader.onerror = function () {
                ctrl.uploadingData.uploading = false;
                ctrl.uploadingData.uploaded = false;
                ctrl.uploadingData.name = '';
            };
            reader.onprogress = function (load) {
                if (!lodash.isNil(load.target.result)) {
                    var progressPercentage = parseInt(100.0 * load.loaded / load.total);

                    ctrl.uploadingData.uploading = true;
                    ctrl.uploadingData.progress = progressPercentage + '%';
                }
            };
            reader.readAsDataURL(file);

            ctrl.uploadingData.uploading = false;
        }

        //
        // Private methods
        //

        /**
         * Converts base64 to Blob and returns it
         * @param {string} b64Data
         * @param {string} contentType
         * @param {number} sliceSize
         * @returns {Blob}
         */
        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = lodash.defaultTo(contentType, '');
            sliceSize = lodash.defaultTo(sliceSize, 512);

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {type: contentType});
            return blob;
        }

        /**
         * Converts time to milliseconds, seconds, minutes depends on value
         * @param {number} millisec
         * @returns {string}
         */
        function convertTime(millisec) {
            var seconds = (millisec / 1000).toFixed(1);
            var minutes = (millisec / (1000 * 60)).toFixed(1);

            return millisec < 1000  ? millisec + ' ms' :
                   seconds  < 60    ? seconds  + ' s'  : minutes + ' min';
        }

        /**
         * Handler on drag-n-dropping a file
         */
        function onDragNDropFileToBody() {
            var dropSection = $element.find('.drop-section');

            // Register event handlers for drag'n'drop of files
            dropSection
                .on('dragover', null, false)
                .on('dragenter', null, function (event) {
                    event.preventDefault();

                    $element.find('.upload-file-section').css('padding', '3px');
                    $element.find('.drop-section').css('border-color', '#239bca');
                })
                .on('dragleave', null, function (event) {
                    event.preventDefault();

                    $element.find('.upload-file-section').css('padding', '8px');
                    $element.find('.drop-section').css('border-color', '#c9c9cd');
                })
                .on('drop', null, function (event) {
                    event.preventDefault();

                    if (!ctrl.uploadingData.uploading) {
                        ctrl.uploadingData = {
                            uploading: false,
                            uploaded: false,
                            progress: '0%',
                            name: ''
                        };

                        var file = lodash.get(event, 'originalEvent.dataTransfer.files[0]');

                        uploadFile(file);
                    }

                    $element.find('.upload-file-section').css('padding', '8px');
                    $element.find('.drop-section').css('border-color', '#c9c9cd');
                });
        }

        /**
         * Updates headers after changing request body type or path
         */
        function updateRequestHeaders() {
            var requestHeaders = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers', {});

            ctrl.headers = lodash.map(requestHeaders, function (value, key) {
                var header = {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: true,
                        name: 'label',
                        checked: true
                    }
                };
                var existedHeader = lodash.find(ctrl.headers, ['name', key]);

                if (angular.isDefined(existedHeader)) {
                    header.ui = lodash.assign(header.ui, existedHeader.ui);
                }

                return header;
            });
            ctrl.headers = lodash.compact(ctrl.headers);
        }

        /**
         * Updates request`s headers
         */
        function updateHeaders() {
            var newHeaders = {};

            lodash.forEach(ctrl.headers, function (header) {
                if (header.ui.checked) {
                    newHeaders[header.name] = header.value;
                }
            });

            lodash.set(ctrl.selectedEvent, 'spec.attributes.headers', newHeaders);

            ctrl.path = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers[\'x-nuclio-path\']', '');
        }
    }
}());
