(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('DialogsService', DialogsService);

    function DialogsService($document, $q, $i18next, i18next, lodash, ngDialog, EventHelperService,
                            FormValidationService) {
        return {
            alert: alert,
            confirm: confirm,
            customConfirm: customConfirm,
            iframe: iframe,
            image: image,
            oopsAlert: oopsAlert,
            prompt: prompt,
            text: text
        };

        //
        // Public methods
        //

        /**
         * Show alert message
         *
         * @param {string|Array.<string>} [alertText] - alert content
         * @param {string} [buttonText=OK] - text displayed on Ok button
         * @returns {Promise} a promise that resolves on closing dialog
         */
        function alert(alertText, buttonText) {
            buttonText = lodash.defaultTo(buttonText, $i18next.t('common:OK', {lng: i18next.language}));

            if (lodash.isArray(alertText)) {
                alertText = alertText.length === 1 ? lodash.first(alertText) :
                    '<ul class="error-list"><li class="error-list-item">' +
                        alertText.join('</li><li class="error-list-item">') + '</li></ul>';
            }

            return ngDialog.open({
                template: '<div class="notification-text title igz-scrollable-container" data-ng-scrollbars>' +
                alertText + '</div>' +
                '<div class="buttons">' +
                '<button class="igz-button-primary" data-ng-click="closeThisDialog() || $event.stopPropagation()" ' +
                'data-test-id="general.alert_ok.button">' +
                buttonText + '</button></div>',
                plain: true
            })
                .closePromise;
        }

        /**
         * Show confirmation dialog
         *
         * @param {string|Object} confirmText that will be shown in pop-up
         * @param {string} [confirmText.message] the text of the dialog body
         * @param {string} [confirmText.description] additional info
         * @param {string} confirmButton Text displayed on Confirm button
         * @param {string} [cancelButton=Cancel] Text displayed on Cancel button
         * @param {string} type - type of popup dialog
         * @returns {Object}
         */
        function confirm(confirmText, confirmButton, cancelButton, type) {
            var confirmMessage = type === 'nuclio_alert' && lodash.isPlainObject(confirmText) ?
                confirmText.message : confirmText;

            var confirmButtonClass = lodash.includes(['critical_alert', 'nuclio_alert'], type) ?
                'igz-button-remove' : type === 'text-edit' ? 'igz-button-just-text' : 'igz-button-primary';

            var cancelButtonClass = type === 'text-edit' ? 'igz-button-primary' : 'igz-button-just-text';

            var cancelButtonCaption = lodash.defaultTo(cancelButton, $i18next.t('common:CANCEL', {
                lng: i18next.language
            }));
            var noDescription = type !== 'nuclio_alert' || lodash.isEmpty(confirmText.description);

            var template = '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' +
                '<div class="nuclio-alert-icon"></div><div class="notification-text title">' + confirmMessage +
                '</div>' + (noDescription ? '' : '<div class="notification-text description">' +
                confirmText.description + '</div>') +
                '<div class="buttons" data-ng-class="{\'igz-grouped-buttons-reverse\': ' + (type === 'text-edit') + '}">' +
                '<button class="' + cancelButtonClass + '" tabindex="0" data-ng-click="closeThisDialog(0)" ' +
                'data-test-id="general.confirm_cancel.button" ' +
                'data-ng-keydown="$event.keyCode === 13 && closeThisDialog(0)">' + cancelButtonCaption + '</button>' +
                '<button class="' + confirmButtonClass + '" tabindex="0" data-ng-click="confirm(1)" ' +
                'data-test-id="general.confirm_confirm.button" data-ng-keydown="$event.keyCode === 13 && confirm(1)">' +
                confirmButton + '</button>' +
                '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                name: 'confirm',
                className: type === 'nuclio_alert' ?
                    'ngdialog-theme-nuclio delete-entity-dialog-wrapper' : 'ngdialog-theme-iguazio'
            });
        }

        /**
         * Show confirmation dialog with custom number of buttons
         * @param {string} confirmText that will be shown in pop-up
         * @param {string} cancelButton Text displayed on Cancel button
         * @param {Array} actionButtons Array of action buttons
         * @returns {Object}
         */
        function customConfirm(confirmText, cancelButton, actionButtons) {
            var template = '<div class="notification-text title">' + confirmText + '</div>' +
                '<div class="buttons">' +
                '<button class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(-1)" ' +
                'data-test-id="general.confirm_cancel.button" ' +
                'data-ng-keydown="$event.keyCode === 13 && closeThisDialog(-1)">' + cancelButton + '</button>';
            lodash.each(actionButtons, function (button, index) {
                template += '<button class="igz-button-primary" tabindex="0" data-ng-click="confirm(' +
                    index + ')" data-test-id="general.confirm_confirm_' + index + '.button" ' +
                    'data-ng-keydown="$event.keyCode === 13 && confirm(' + index + ')">' + button + '</button>';
            });
            template += '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                trapFocus: false
            });
        }

        /**
         * Shows iframe with content in a dialog
         *
         * @param {string} content that will be shown in pop-up
         * @param {string} [title='']
         * @returns {Promise}
         */
        function iframe(content, title) {
            var data = {
                buttonText: $i18next.t('common:CLOSE', {lng: i18next.language}),
                content: content,
                title: lodash.defaultTo(title, '')
            };

            return ngDialog.open({
                template: '<div class="iframe-dialog-content">' +
                              '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' +
                              '<div class="title">{{ngDialogData.title}}</div>' +
                              '<div class="main-content">' +
                                  '<iframe class="frame" srcdoc="{{ngDialogData.content}}"></iframe>' +
                              '</div>' +
                              '<div class="buttons">' +
                                  '<button class="igz-button-primary" data-ng-click="closeThisDialog()">{{ngDialogData.buttonText}}</button>' +
                              '</div>' +
                          '</div>',
                plain: true,
                data: data,
                className: 'ngdialog-theme-iguazio iframe-dialog'
            })
                .closePromise;
        }

        /**
         * Show image
         *
         * @param {string} src that will be shown in pop-up
         * @param {string} [label] actual filename to be shown in title
         * @returns {Promise}
         */
        function image(src, label) {
            label = angular.isString(label) ? label :
                $i18next.t('common:TOOLTIP.IMAGE_PREVIEW', {lng: i18next.language}) + ':';

            return ngDialog.open({
                template: '<div class="title text-ellipsis"' +
                    'data-uib-tooltip="' + label + '"' +
                    'data-tooltip-popup-delay="400"' +
                    'data-tooltip-append-to-body="true"' +
                    'data-tooltip-placement="bottom-left">' + label + '</div>' +
                    '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' +
                    '<div class="image-preview-container">' +
                    '<img class="image-preview" src="' + src + '" alt="' +
                    $i18next.t('common:HAVE_NO_PERMISSIONS_TO_READ_FILE', {lng: i18next.language}) +
                    '"/></div>',
                plain: true,
                className: 'ngdialog-theme-iguazio image-dialog'
            })
                .closePromise;
        }

        /**
         * Show oops alert message when server is unreachable
         * @param {string} alertText that will be shown in pop-up
         * @param {string} buttonText displayed on Ok button
         * @returns {Promise}
         */
        function oopsAlert(alertText, buttonText) {
            return ngDialog.open({
                template: '<div class="header"></div><div class="notification-text">' + alertText + '</div>' +
                '<div class="buttons">' +
                '<button class="refresh-button no-padding" data-ng-click="closeThisDialog()" ' +
                'data-test-id="general.oops_refresh.button" ' +
                '<span class="igz-icon-refresh"></span>' + buttonText + '</button>' +
                '</div>',
                plain: true,
                className: 'ngdialog-theme-iguazio oops-dialog'
            })
                .closePromise;
        }

        /**
         * Show confirmation dialog with input field
         *
         * @param {string} promptText that will be shown in pop-up
         * @param {string} [okButton='OK'] Text displayed on Confirm button
         * @param {string} [cancelButton='Cancel'] Text displayed on Cancel button
         * @param {string} [defaultValue=''] Value that should be shown in text input after prompt is opened
         * @param {string} [placeholder=''] Text input placeholder
         * @param {Object} [validation] Validation pattern
         * @param {boolean} [required=false] Should input be required or not
         * @returns {Object}
         */
        function prompt(promptText, okButton, cancelButton, defaultValue, placeholder, validation, required) {
            var lng = i18next.language;
            var okButtonCaption = lodash.defaultTo(okButton, $i18next.t('common:OK', {lng: lng}));
            var cancelButtonCaption = lodash.defaultTo(cancelButton, $i18next.t('common:CANCEL', {lng: lng}));
            var data = {
                value: lodash.defaultTo(defaultValue, ''),
                igzDialogPromptForm: {},
                checkInput: function () {
                    if (angular.isDefined(validation) || required) {
                        data.igzDialogPromptForm.$submitted = true;
                    }
                    return data.igzDialogPromptForm.$valid;
                },
                inputValueCallback: function (newData) {
                    data.value = newData;
                }
            };

            if (angular.isDefined(validation) || required) {
                lodash.assign(data, {
                    validation: validation,
                    inputName: 'promptName',
                    isShowFieldInvalidState: FormValidationService.isShowFieldInvalidState
                });
            }

            var promptDialog = ngDialog.open({
                template: '<div data-ng-form="ngDialogData.igzDialogPromptForm">' +
                    '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' +
                    '<div class="notification-text title">' + promptText + '</div>' +
                    '<div class="main-content">' +
                        '<div class="field-group">' +
                            '<div class="field-input">' +
                                '<igz-validating-input-field ' +
                                    'data-field-type="input" ' +
                                    'data-input-name="promptName" ' +
                                    'data-input-value="ngDialogData.value" ' +
                                    'data-form-object="ngDialogData.igzDialogPromptForm" ' +
                                    'data-is-focused="true" ' +
                                    (angular.isUndefined(validation) ? '' : 'data-validation-pattern="ngDialogData.validation" ' +
                                    'data-only-valid-characters="true" data-trim="false" ') +
                                    (lodash.isEmpty(placeholder) ? '' : 'data-placeholder-text="' + placeholder + '" ') +
                                    (lodash.defaultTo(required, false) ? 'data-validation-is-required="true" ' : '') +
                                    'data-update-data-callback="ngDialogData.inputValueCallback(newData)"' +
                                '></igz-validating-input-field>' +
                                (angular.isDefined(validation) ? '<div class="error-text" data-ng-show="ngDialogData.isShowFieldInvalidState(ngDialogData.igzDialogPromptForm, ngDialogData.inputName)">' +
                                    $i18next.t('common:ERROR_MSG.INVALID_INPUT_PLEASE_TRY_AGAIN', {lng: lng}) +
                                '</div>' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="buttons">' +
                    '<button class="igz-button-just-text" data-ng-click="closeThisDialog()" ' +
                    'data-test-id="general.prompt_cancel.button">' + cancelButtonCaption + '</button>' +
                '<button class="igz-button-primary" ' +
                    'data-ng-click="ngDialogData.checkInput() && closeThisDialog(ngDialogData.value)" ' +
                    'data-test-id="general.prompt_ok.button">' + okButtonCaption + '</button>' +
                '</div>',
                plain: true,
                data: data
            });

            function confirmCallback(event) {
                if (event.keyCode === EventHelperService.ENTER) {
                    data.checkInput() && promptDialog.close(data.value);
                }
            }

            $document.on('keypress', confirmCallback);

            return promptDialog
                .closePromise
                .then(function (dialog) { // if Cancel is clicked, reject the promise
                    $document.off('keypress', confirmCallback);

                    return angular.isDefined(dialog.value) ?
                        dialog.value : $q.reject($i18next.t('common:ERROR_MSG.CANCELLED', {lng: lng}));
                });
        }

        /**
         * Shows text
         *
         * @param {string} content that will be shown in pop-up
         * @param {Object} [node] actual node to be shown
         * @param {function} submitData function for submitting data
         * @param {string} language the language to use in text editor
         * @returns {Promise}
         */
        function text(content, node, submitData, language) {
            var lng = i18next.language;
            var data = {
                closeButtonText: $i18next.t('common:CLOSE', {lng: lng}),
                submitButtonText: $i18next.t('common:SAVE', {lng: lng}),
                submitData: submitData,
                label: angular.isString(node.label) ? node.label : 'Text preview:',
                node: node,
                content: content,
                language: language
            };

            return ngDialog.open({
                template: '<igz-text-edit data-label="{{ngDialogData.label}}" data-ng-dialog-id="{{ngDialogData.ngDialogId}}" data-language="{{ngDialogData.language}}" data-content="{{ngDialogData.content}}"' +
                          'data-submit-button-text="{{ngDialogData.submitButtonText}}" data-submit-data="ngDialogData.submitData(newContent)"' +
                          'data-close-button-text="{{ngDialogData.closeButtonText}}" data-close-dialog="closeThisDialog(value)">' +
                          '</igz-text-edit>',
                plain: true,
                data: data,
                className: 'ngdialog-theme-iguazio text-edit'
            })
                .closePromise;
        }
    }
}());
