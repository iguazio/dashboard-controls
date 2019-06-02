/* eslint max-statements: ["error", 100] */
/* eslint complexity: ["error", 15] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionEventPane', {
            bindings: {
                version: '<',
                createFunctionEvent: '&',
                getExternalIpAddresses: '&',
                getFunctionEvents: '&',
                deleteFunctionEvent: '&',
                invokeFunction: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-code/function-event-pane/function-event-pane.tpl.html',
            controller: NclFunctionEventPaneController
        });

    function NclFunctionEventPaneController($element, $rootScope, $scope, $timeout, $q, lodash, moment, download,
                                            ConvertorService, DialogsService, EventHelperService, VersionHelperService) {
        var ctrl = this;

        var canceler = null;
        var canceledInvocation = false;
        var HISTORY_LIMIT = 100;

        ctrl.createEvent = true;
        ctrl.externalIPAddress = '';
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
        ctrl.igzScrollConfig = {
            maxElementsCount: 4,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.showResponse = false;
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
        ctrl.downloadResponseFile = downloadResponseFile;
        ctrl.deleteEvent = deleteEvent;
        ctrl.deleteFile = deleteFile;
        ctrl.fixLeftBar = fixLeftBar;
        ctrl.getInvocationUrl = getInvocationUrl;
        ctrl.getMethodColor = getMethodColor;
        ctrl.handleAction = handleAction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isDisabledTestButton = isDisabledTestButton;
        ctrl.onChangeData = onChangeData;
        ctrl.onChangeLogLevel = onChangeLogLevel;
        ctrl.onChangeRequestBodyType = onChangeRequestBodyType;
        ctrl.onChangeRequestMethod = onChangeRequestMethod;
        ctrl.onChangeRequestSourceCode = onChangeRequestSourceCode;
        ctrl.onChangeTab = onChangeTab;
        ctrl.resetData = resetData;
        ctrl.saveEvent = saveEvent;
        ctrl.selectEvent = selectEvent;
        ctrl.testEvent = testEvent;
        ctrl.toggleLeftBar = toggleLeftBar;
        ctrl.uploadFile = uploadFile;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isSplashShowed.value = true;
            ctrl.eventLogLevel = 'debug';

            if (lodash.isNil(ctrl.version.ui.deployedVersion)) {
                VersionHelperService.updateIsVersionChanged(ctrl.version);
            }

            updateHistory();

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
                            'Content-Type': 'text/plain'
                        },
                        path: ''
                    },
                    body: ''
                }
            });

            ctrl.getFunctionEvents({functionData: ctrl.version})
                .then(function (response) {
                    ctrl.savedEvents = response;
                })
                .catch(function () {
                    DialogsService.alert('Oops: Unknown error occurred while retrieving events');
                })
                .finally(function () {
                    ctrl.isSplashShowed.value = false;
                });

            ctrl.getExternalIpAddresses()
                .then(function (result) {
                    ctrl.externalIPAddress = lodash.get(result, 'externalIPAddresses.addresses[0]', '');
                })
                .catch(function () {
                    ctrl.version.ui.invocationURL = '';
                });

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
            if (canceler !== null) {
                canceler.resolve();
                canceler = null;
            }
            canceledInvocation = true;
        }

        /**
         * Downloads response body file
         */
        function downloadResponseFile() {
            var fileName = ctrl.selectedEvent.spec.displayName + '_' + moment.utc().format('YYYY-MM-DDThh-mm-ss');
            var contentType = lodash.get(ctrl.testResult.headers, 'content-type', lodash.get(ctrl.testResult.headers, 'Content-Type', null));
            var textualFile = lodash.includes(contentType, 'text') || contentType === 'application/json';

            if (textualFile) {
                download.fromData(ctrl.testResult.body, contentType, fileName);
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

                    ctrl.deleteFunctionEvent({eventData: eventData})
                        .then(function () {

                            // update test events list
                            ctrl.getFunctionEvents({functionData: ctrl.version})
                                .then(function (response) {
                                    ctrl.savedEvents = response;

                                    if (event.metadata.name === ctrl.selectedEvent.metadata.name) {
                                        resetData();
                                    }
                                })
                                .catch(function (error) {
                                    var msg = 'Oops: Unknown error occurred while retrieving events';
                                    DialogsService.alert(lodash.get(error, 'data.error', msg));
                                });
                        })
                        .catch(function (error) {
                            var msg = 'Oops: Unknown error occurred while deleting events';
                            DialogsService.alert(lodash.get(error, 'data.error', msg));
                        })
                        .finally(function () {
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
            var httpPort = lodash.get(ctrl.version, 'ui.deployResult.status.httpPort', null);

            if (lodash.isNil(httpPort)) {
                httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            }

            if (httpPort && lodash.includes(['building', 'error'], lodash.get(ctrl.version, 'ui.deployResult.status.state'))) {
                httpPort = null;
            }

            setInvocationUrl(ctrl.externalIPAddress, httpPort);

            return lodash.isNull(httpPort) ? 'Not yet deployed' : ctrl.version.ui.invocationURL + '/';
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
                   method === 'DELETE'  ? '#e54158' :
                                          '#96a8d3';
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
            var httpPort = lodash.get(ctrl.version, 'ui.deployResult.status.httpPort', null);

            if (lodash.isNil(httpPort)) {
                httpPort = lodash.get(ctrl.version, 'status.httpPort', null);
            }

            if (httpPort && lodash.includes(['building', 'error'], lodash.get(ctrl.version, 'ui.deployResult.status.state'))) {
                httpPort = null;
            }

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
         * Changes log level data
         * @param {Object} selectedLogLevel - selected log level
         */
        function onChangeLogLevel(selectedLogLevel) {
            ctrl.eventLogLevel = selectedLogLevel.id;
        }

        /**
         * Changes function's test request type of body (text, json, file)
         * @param {Object} bodyType
         */
        function onChangeRequestBodyType(bodyType) {
            ctrl.requestBodyType = bodyType;
            ctrl.selectedEvent.spec.body = '';

            if (bodyType.id === 'file') {
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
         * Changes function's test request method
         * @param {Object} requestMethod
         */
        function onChangeRequestMethod(requestMethod) {
            lodash.set(ctrl.selectedEvent, 'spec.attributes.method', requestMethod.name);
        }

        /**
         * Changes request's source code
         * @param {string} sourceCode
         */
        function onChangeRequestSourceCode(sourceCode) {
            lodash.set(ctrl.selectedEvent, 'spec.body', sourceCode);
        }

        /**
         * Changes function's test tab
         * @param {Object} tab
         * @param {string} field
         */
        function onChangeTab(tab, field) {
            ctrl[field] = tab;
        }

        /**
         * Resets all changes
         */
        function resetData() {
            ctrl.testEventsForm.$setPristine();
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
                            'Content-Type': 'text/plain'
                        },
                        path: ''
                    },
                    body: ''
                }
            };
            ctrl.createEvent = true;
            ctrl.testResult = null;
            ctrl.showResponse = false;
            ctrl.requestBodyType = ctrl.requestBodyTypes[0];
            ctrl.selectedResponseTab = ctrl.responseNavigationTabs[0];
            ctrl.headers = null;
            ctrl.eventLogLevel = 'debug';

            updateRequestHeaders();
        }

        /**
         * Saves created event
         * @param {Object} event
         */
        function saveEvent(event) {
            ctrl.testEventsForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                (ctrl.testEventsForm.$valid)) {

                var eventToSave = angular.copy(ctrl.selectedEvent);
                if (ctrl.requestBodyType === 'file') {
                    eventToSave.spec.body = '';
                }

                // set `nuclio.io/function-name` label to relate this function event to its function
                lodash.set(eventToSave, ['metadata', 'labels', 'nuclio.io/function-name'], ctrl.version.metadata.name);

                ctrl.isSplashShowed.value = true;

                // save created event on beck-end
                ctrl.createFunctionEvent({eventData: eventToSave, isNewEvent: ctrl.createEvent})
                    .then(function (newEvent) {
                        ctrl.getFunctionEvents({functionData: ctrl.version}).then(function (response) {
                            ctrl.savedEvents = response;
                        });

                        if (ctrl.createEvent && angular.isDefined(newEvent)) {
                            ctrl.selectedEvent = newEvent;
                            ctrl.selectedEvent.spec.body = lodash.defaultTo(ctrl.selectedEvent.spec.body, '');
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
         * @param {string} [location] - location of event(ex. history)
         */
        function selectEvent(event, location) {
            if (location === 'history') {
                lodash.set(event, 'spec.displayName', '');
            }

            ctrl.selectedEvent = angular.copy(event);
            ctrl.selectedEvent.spec.body = lodash.defaultTo(ctrl.selectedEvent.spec.body, '');
            ctrl.createEvent = false;
            ctrl.showResponse = false;
            ctrl.testResult = null;
            ctrl.showLeftBar = ctrl.fixedLeftBar;
            ctrl.selectedResponseTab = ctrl.responseNavigationTabs[0];

            var contentType = ctrl.selectedEvent.spec.attributes.headers['Content-Type'];
            ctrl.requestSourceCodeLanguage = contentType === 'application/json' ? 'json' : 'textplain';
            updateRequestHeaders();

            var requestType = contentType === 'application/json' ? 'json' :
                              contentType === 'text/plain'       ? 'text' :
                                                                   'file';
            ctrl.requestBodyType = lodash.find(ctrl.requestBodyTypes, ['id', requestType]);
        }

        /**
         * Invokes event
         * @param {Object} event
         */
        function testEvent(event) {
            ctrl.testEventsForm.$setPristine();
            var httpPort = lodash.get(ctrl.version, 'status.httpPort', null);

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                !lodash.isNull(httpPort) && !ctrl.uploadingData.uploading && !ctrl.testing) {
                var startTime = moment();
                canceler = $q.defer();
                canceledInvocation = false;
                ctrl.testing = true;
                ctrl.testResult = {};
                ctrl.responseImage = null;

                var eventData = angular.copy(ctrl.selectedEvent);
                lodash.set(eventData, 'spec.attributes.logLevel', ctrl.eventLogLevel);

                ctrl.invokeFunction({eventData: eventData, canceler: canceler.promise})
                    .then(function (response) {
                        return $q.reject(response);
                    })
                    .catch(function (invocationData) {
                        if (angular.isDefined(invocationData.status) && invocationData.status !== -1) {
                            var lowerCaseHeaders = lodash.mapKeys(invocationData.headers, function (value, key) {
                                return key.toLowerCase();
                            });

                            ctrl.invokeTime = convertTime(moment().diff(startTime));

                            ctrl.testResult = {
                                status: {
                                    statusCode: invocationData.status,
                                    statusText: invocationData.statusText
                                },

                                // not using `lowerCaseHeaders` here so the headers will be displayed as-is
                                headers: lodash.omit(invocationData.headers, ['x-nuclio-logs', 'X-Nuclio-Logs']),
                                body: invocationData.body
                            };

                            var responseHeadersTab = lodash.find(ctrl.responseNavigationTabs, ['id', 'headers']);
                            responseHeadersTab.badge = lodash.size(ctrl.testResult.headers);

                            saveEventToHistory();

                            var logs = lodash.get(lowerCaseHeaders, 'x-nuclio-logs', null);
                            var responseLogsTab = lodash.find(ctrl.responseNavigationTabs, ['id', 'logs']);
                            ctrl.logs = lodash.isNull(logs) ? [] : angular.fromJson(logs);
                            responseLogsTab.badge = ctrl.logs.length;

                            var size = lodash.get(lowerCaseHeaders, 'content-length', null);
                            ctrl.responseSize = lodash.isNull(size) ? size :
                                ConvertorService.getConvertedBytes(Number(size), ['B', 'KB', 'MB', 'GB']);

                            var contentType = lodash.get(lowerCaseHeaders, 'content-type', null);

                            var textualFile = lodash.includes(contentType, 'text') || contentType === 'application/json';

                            // if content type is "application/json" then attempt to pretty-print JSON. The body could
                            // be either a serialized-JSON string, or an object.
                            // monaco editor must be assigned a string, not an object, then even if the content type is
                            // not "application/json" but for any reason the body is an object, attempt to pretty-print
                            // it as JSON.
                            if (contentType === 'application/json' || lodash.isObject(invocationData.body)) {
                                ctrl.testResult.body = formatJson(invocationData.body);
                            }

                            var imageFile = lodash.startsWith(contentType, 'image/');
                            if (imageFile) {
                                var reader = new FileReader();
                                reader.readAsDataURL(ctrl.testResult.body);
                                reader.onload = function () {
                                    ctrl.responseImage = reader.result;
                                    ctrl.testing = false;
                                };
                            } else {
                                ctrl.testing = false;
                            }

                            ctrl.responseBodyType = textualFile ? 'code'  :
                                                    imageFile   ? 'image' :
                                                                  'N/A';

                            ctrl.showResponse = true;
                        } else {
                            if (!canceledInvocation) {
                                var statusText = angular.isDefined(invocationData.error) ? invocationData.error :
                                    invocationData.status + ' ' + invocationData.statusText;
                                DialogsService.alert('Oops: Error occurred while invoking. Status: ' + statusText);
                            }

                            ctrl.testing = false;
                            ctrl.showResponse = false;
                        }

                        ctrl.isInvocationSuccess = lodash.startsWith(invocationData.status, '2');
                    });
            }
        }

        /**
         * Toggles left bar
         * @param {boolean} [displayLeftBar]
         */
        function toggleLeftBar(displayLeftBar) {
            ctrl.showLeftBar = lodash.defaultTo(displayLeftBar, !ctrl.showLeftBar);
            ctrl.fixedLeftBar = false;
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
            ctrl.uploadingData.uploading = true;

            reader.onload = function (onloadEvent) {
                if (!ctrl.uploadingData.uploaded) {
                    ctrl.uploadingData.name = file.name;
                    ctrl.uploadingData.progress = '100%';

                    if (onloadEvent.target.result === '') {
                        DialogsService.alert('Oops: Unknown error occurred while uploading a file');

                        deleteFile();
                    } else {
                        try {
                            ctrl.selectedEvent.spec.body = b64toBlob(onloadEvent.target.result.split(',')[1], file.type);

                            ctrl.selectedEvent.spec.attributes.headers['Content-Type'] = file.type;
                            updateRequestHeaders();
                        } catch (ex) {
                            DialogsService.alert('Oops: Error occurred while uploading a file. ' + ex);

                            deleteFile();
                        }
                    }

                    $timeout(function () {
                        ctrl.uploadingData.uploading = false;
                        ctrl.uploadingData.uploaded = true;
                    }, 500);
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

            return new Blob(byteArrays, {type: contentType});
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
                   seconds  < 60    ? seconds  + ' s'  :
                                      minutes  + ' min';
        }

        /**
         * Formats an object as a formatted JSON.
         * @param {*} value - the object or a JSON-serialized string to format.
         * @returns {*} JSON-serialized string representation of `value` formatted with newlines and indentation.
         *      In case of an error in JSON conversion or if `value` is not a string nor an object, returns `value`
         *      as-is.
         */
        function formatJson(value) {
            try {
                if (lodash.isString(value)) {
                    value = angular.fromJson(value);
                }

                if (!lodash.isObject(value)) {
                    return returnValue();
                }

                return angular.toJson(value, 4);
            } catch (error) {
                return returnValue();
            }

            /**
             * Returns `value`.
             * @returns {*} `value` as-is.
             */
            function returnValue() {
                return value;
            }
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
                            uploading: true,
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
         * Saves tested event to local storage history
         */
        function saveEventToHistory() {
            var updatedHistory = lodash.defaultTo(angular.fromJson(localStorage.getItem('test-events')), []);
            if (updatedHistory.length === HISTORY_LIMIT) {
                updatedHistory.splice(0, 1);
            }
            var eventToSave = angular.copy(ctrl.selectedEvent);
            delete eventToSave.spec.displayName;
            updatedHistory.push(eventToSave);

            localStorage.setItem('test-events', angular.toJson(updatedHistory));
            updateHistory();
        }

        /**
         * Sets the invocation URL of the function
         * @param {string} ip - external IP address
         * @param {number} port - HTTP port
         */
        function setInvocationUrl(ip, port) {
            ctrl.version.ui.invocationURL =
                lodash.isEmpty(ip) || !lodash.isNumber(port) ? '' : 'http://' + ip + ':' + port;
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
         * Updates request's headers
         */
        function updateHeaders() {
            var newHeaders = {};

            lodash.forEach(ctrl.headers, function (header) {
                if (header.ui.checked) {
                    newHeaders[header.name] = header.value;
                }
            });

            lodash.set(ctrl.selectedEvent, 'spec.attributes.headers', newHeaders);
        }

        /**
         * Updates invoking history
         */
        function updateHistory() {
            var nameField = 'metadata.labels[\'nuclio.io/function-name\']';
            ctrl.history = lodash.defaultTo(angular.fromJson(localStorage.getItem('test-events')), []);
            ctrl.history = lodash.filter(ctrl.history, [nameField, ctrl.version.metadata.name]);
        }
    }
}());
