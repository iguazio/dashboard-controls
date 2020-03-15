/**
 * Angular directive to truncate multi-line text to visible height
 * @param bind (angular bound value to append) REQUIRED
 * @param ellipsisAppend (string) string to append at end of truncated text after ellipsis, can be HTML OPTIONAL
 * @param ellipsisAppendClick (function) function to call if ellipsisAppend is clicked (ellipsisAppend must be clicked) OPTIONAL
 * @param ellipsisSymbol (string) string to use as ellipsis, replaces default '...' OPTIONAL
 * @param ellipsisSeparator (string) separator to split string, replaces default ' ' OPTIONAL
 *
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData"></p>
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData" data-ellipsis-symbol="---"></p>
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData" data-ellipsis-append="read more"></p>
 * @example <p data-igz-multiline-ellipsis data-ng-bind="boundData" data-ellipsis-append="read more" data-ellipsis-append-click="displayFull()"></p>
 */
/* eslint complexity: ["error", 27] */
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .directive('igzMultilineEllipsis', igzMultilineEllipsis);

    function igzMultilineEllipsis($sce, $timeout, $window) {
        return {
            restrict: 'A',
            scope: {
                ngBind: '=',
                ngBindHtml: '=?',
                ellipsisAppend: '@?',
                ellipsisAppendClick: '&?',
                ellipsisSymbol: '@?',
                ellipsisSeparator: '@?',
                ellipsisSeparatorReg: '=?',
                useParent: '@?'
            },
            link: link
        };

        function link(scope, element, attributes) {
            var AsyncDigest = function (delay) {
                var timeout = null;
                var queue = [];

                this.remove = function (fn) {
                    if (queue.indexOf(fn) !== -1) {
                        queue.splice(queue.indexOf(fn), 1);
                        if (queue.length === 0) {
                            $timeout.cancel(timeout);
                            timeout = null;
                        }
                    }
                };
                this.add = function (fn) {
                    if (queue.indexOf(fn) === -1) {
                        queue.push(fn);
                    }
                    if (!timeout) {
                        timeout = $timeout(function () {
                            var copy = queue.slice();
                            timeout = null;

                            // reset scheduled array first in case one of the functions throws an error
                            queue.length = 0;
                            copy.forEach(function (fnc) {
                                fnc();
                            });
                        }, delay);
                    }
                };
            };

            var asyncDigestImmediate = new AsyncDigest(0);
            var asyncDigestDebounced = new AsyncDigest(75);

            // Window Resize Variables
            attributes.lastWindowResizeTime = 0;
            attributes.lastWindowResizeWidth = 0;
            attributes.lastWindowResizeHeight = 0;
            attributes.lastWindowTimeoutEvent = null;

            //State Variables
            attributes.isTruncated = false;

            var $win = angular.element($window);
            $win.bind('resize', onResize);

            //
            // Private methods
            //

            /**
             * Builds ellipsis
             */
            function buildEllipsis() {
                var binding = scope.ngBind || scope.ngBindHtml;
                var isTrustedHTML = false;
                if ($sce.isEnabled() && angular.isObject(binding) && $sce.getTrustedHtml(binding)) {
                    isTrustedHTML = true;
                    binding = $sce.getTrustedHtml(binding);
                }
                if (binding) {
                    var isHtml = (!Boolean(scope.ngBind) && Boolean(scope.ngBindHtml));
                    var i = 0,
                        ellipsisSymbol = angular.isDefined(attributes.ellipsisSymbol) ? attributes.ellipsisSymbol : '&hellip;',
                        ellipsisSeparator = angular.isDefined(scope.ellipsisSeparator) ? attributes.ellipsisSeparator : ' ',
                        ellipsisSeparatorReg = angular.isDefined(scope.ellipsisSeparatorReg) ? scope.ellipsisSeparatorReg : false,
                        appendString = (angular.isDefined(scope.ellipsisAppend) && scope.ellipsisAppend !== '') ?
                            ellipsisSymbol + '<span>' + scope.ellipsisAppend + '</span>' : ellipsisSymbol,
                        bindArray = ellipsisSeparatorReg ? binding.match(ellipsisSeparatorReg) : binding.split(ellipsisSeparator);

                    attributes.isTruncated = false;
                    if (isHtml) {
                        element.html(binding);
                    } else {
                        element.text(binding);
                    }

                    // If text has overflow
                    if (isOverflowed(element, scope.useParent)) {
                        var bindArrayStartingLength = bindArray.length,
                            initialMaxHeight = scope.useParent ? getParentHeight(element) : element[0].clientHeight;

                        if (isHtml) {
                            element.html(binding + appendString);
                        } else {
                            element.text(binding).html(element.html() + appendString);
                        }

                        // Set data-overflow on element for targeting
                        element.attr('data-overflowed', 'true');

                        // Set complete text and remove one word at a time, until there is no overflow
                        for (; i < bindArrayStartingLength; i++) {
                            bindArray.pop();

                            if (isHtml) {
                                element.html(bindArray.join(ellipsisSeparator) + appendString);
                            } else {
                                element.text(bindArray.join(ellipsisSeparator)).html(element.html() + appendString);
                            }

                            if ((scope.useParent ? element.parent()[0] : element[0]).scrollHeight < initialMaxHeight ||
                                isOverflowed(element, scope.useParent) === false) {
                                attributes.isTruncated = true;
                                break;
                            }
                        }

                        // If append string was passed and append click function included
                        if (ellipsisSymbol !== appendString && angular.isDefined(scope.ellipsisAppendClick) &&
                            scope.ellipsisAppendClick !== '') {
                            element.find('span').bind('click', function (e) {
                                scope.$apply(function () {
                                    scope.ellipsisAppendClick.call(scope, {
                                        event: e
                                    });
                                });
                            });
                        }

                        if (!isTrustedHTML && $sce.isEnabled()) {
                            $sce.trustAsHtml(binding);
                        }
                    } else {
                        element.attr('data-overflowed', 'false');
                    }
                }
            }

            /**
             * Checks window's dimensions for rebuilding ellipsis
             */
            function checkWindowForRebuild() {
                if (attributes.lastWindowResizeWidth !== window.innerWidth || attributes.lastWindowResizeHeight !== window.innerHeight) {
                    buildEllipsis();
                }

                attributes.lastWindowResizeWidth = window.innerWidth;
                attributes.lastWindowResizeHeight = window.innerHeight;
            }

            /**
             * Gets parents's height
             * @param {Object} el
             * @returns {number}
             */
            function getParentHeight(el) {
                var heightOfChildren = 0;
                angular.forEach(el.parent().children(), function (child) {
                    if (child !== el[0]) {
                        heightOfChildren += child.clientHeight;
                    }
                });
                return el.parent()[0].clientHeight - heightOfChildren;
            }

            /**
             * Test if element has overflow of text beyond height or max-height
             * @param {Object} thisElement
             * @param {boolean} useParent
             * @returns {boolean}
             */
            function isOverflowed(thisElement, useParent) {
                thisElement = useParent ? thisElement.parent() : thisElement;
                return thisElement[0].scrollHeight > thisElement[0].clientHeight;
            }

            /**
             * When window width or height changes - re-init truncation
             */
            function onResize() {
                asyncDigestDebounced.add(checkWindowForRebuild);
            }

            //
            // Watchers
            //

            /**
             * Execute ellipsis truncate on ngBind update
             */
            scope.$watch('ngBind', function () {
                asyncDigestImmediate.add(buildEllipsis);
            });

            /**
             * Execute ellipsis truncate on ngBindHtml update
             */
            scope.$watch('ngBindHtml', function () {
                asyncDigestImmediate.add(buildEllipsis);
            });

            /**
             * Execute ellipsis truncate on ngBind update
             */
            scope.$watch('ellipsisAppend', function () {
                buildEllipsis();
            });

            /**
             * Execute ellipsis truncate when element becomes visible
             */
            scope.$watch(function () {
                return element[0].offsetWidth !== 0 && element[0].offsetHeight !== 0
            }, function () {
                asyncDigestDebounced.add(buildEllipsis);
            });

            var unbindRefreshEllipsis = scope.$on('multiline-ellipsis_refresh', function () {
                asyncDigestImmediate.add(buildEllipsis);
            });

            /**
             * Destructor method
             */
            scope.$on('$destroy', function () {
                $win.unbind('resize', onResize);
                asyncDigestImmediate.remove(buildEllipsis);
                asyncDigestDebounced.remove(checkWindowForRebuild);
                if (unbindRefreshEllipsis) {
                    unbindRefreshEllipsis();
                    unbindRefreshEllipsis = null;
                }
            });
        }
    }
}());
