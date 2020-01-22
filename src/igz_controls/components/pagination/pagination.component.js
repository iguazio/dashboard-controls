(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzPagination', {
            bindings: {
                allowJumpToPage: '<?',
                entityName: '@?',
                pageData: '<',
                paginationCallback: '&',
                perPageValues: '<?',
                isPerPageVisible: '<?',
                sort: '<'
            },
            templateUrl: 'igz_controls/components/pagination/pagination.component.tpl.html',
            controller: IgzPaginationController
        });

    function IgzPaginationController($scope, $timeout, lodash, EventHelperService, LocalStorageService,
                                     PaginationService) {
        var ctrl = this;

        ctrl.jumpPage = 1;
        ctrl.maxPagesToDisplay = 9;
        ctrl.page = 0;
        ctrl.pages = [];
        ctrl.perPage = null;
        ctrl.jumpToPagePattern = new RegExp('^\\d+$');

        ctrl.$onInit = onInit;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.jumpToPage = jumpToPage;
        ctrl.onPerPageChanged = onPerPageChanged;
        ctrl.goToNextPage = goToNextPage;
        ctrl.goToPage = goToPage;
        ctrl.goToPrevPage = goToPrevPage;

        //
        // Hook methods
        //

        /**
         * Constructor
         */
        function onInit() {
            lodash.defaults(ctrl, {
                allowJumpToPage: true
            });

            if (angular.isUndefined(ctrl.perPageValues)) {
                ctrl.perPageValues = PaginationService.perPageDefaults();
            }

            ctrl.perPage = lodash.some(ctrl.perPageValues, 'id', ctrl.pageData.size) ? ctrl.pageData.size : ctrl.perPageValues[0].id;

            $scope.$watch('$ctrl.pageData.total', initValues);
            $scope.$watch('$ctrl.pageData.number', updatePage);
        }

        //
        // Public methods
        //

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            ctrl.jumpPage = newData;
        }

        /**
         * Method to jump to page
         */
        function jumpToPage() {
            $timeout(function () {
                ctrl.jumpPage = parseInt(ctrl.jumpPage, 10);
                if (ctrl.jumpPage > 0 && ctrl.jumpPage <= ctrl.pageData.total) {

                    // ctrl.jumpToPage numbering begins from 1, not from 0
                    ctrl.goToPage(ctrl.jumpPage - 1);
                } else {
                    ctrl.jumpPage = String(ctrl.page + 1);
                }
            });
        }

        /**
         * Method selecting active page as first on changing rows per page
         * @param {Object} item - new item
         * @param {boolean} isItemChanged - was value changed or not
         */
        function onPerPageChanged(item, isItemChanged) {
            if (isItemChanged) {
                lodash.set(ctrl, 'perPage', item.id);
            }

            if (angular.isDefined(ctrl.entityName)) {
                LocalStorageService.setItem('itemsPerPage', ctrl.entityName, ctrl.perPage);
            }

            ctrl.goToPage(0);
        }

        /**
         * Go to next page by clicking Next button
         * Or to first page if the last page is current
         * @param {Object} event
         */
        function goToNextPage(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.goToPage((ctrl.page + 1) % ctrl.pageData.total);
            }
        }

        /**
         * Method to switch page
         * @param {string|number} pageNumber
         * @param {Object} [event]
         * @returns {boolean}
         */
        function goToPage(pageNumber, event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                if (pageNumber === '...') {
                    return false;
                }
                ctrl.page = pageNumber;
                generatePagesArray();

                if (angular.isFunction(ctrl.paginationCallback)) {
                    ctrl.paginationCallback({
                        page: ctrl.page,
                        size: ctrl.perPage,
                        additionalParams: {
                            sort: ctrl.sort
                        }
                    });
                }
            }
        }

        /**
         * Go to previous page by clicking Previous button
         * @param {Object} event
         */
        function goToPrevPage(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.goToPage(ctrl.page === 0 ? ctrl.pageData.total - 1 : ctrl.page - 1);
            }
        }

        //
        // Private methods
        //

        /**
         * Generates pages array
         */
        function generatePagesArray() {

            // The first page is always displayed
            ctrl.pages = [0];

            // if there are more pages than allowed, we need to exclude some pages:
            // 1 2 3 4 5 6 7 ... 15
            if (ctrl.pageData.total > ctrl.maxPagesToDisplay) {

                // 4 is count of elements that should be present: '1 page', '...', '...', 'Last page'
                var middleGroup = ctrl.maxPagesToDisplay - 4;

                // if current page is in the beginning
                // 1 2 3 4 5 6 7 ... 15
                if (ctrl.page < middleGroup) {
                    [].push.apply(ctrl.pages, lodash.range(1, middleGroup + 2));

                    ctrl.pages.push('...');

                    // if current page is in the end
                    // 1 ... 9 10 11 12 13 14 15
                } else if (ctrl.page >= ctrl.pageData.total - middleGroup) {
                    ctrl.pages.push('...');
                    [].push.apply(ctrl.pages, lodash.range(ctrl.pageData.total - middleGroup - 2, ctrl.pageData.total - 1));

                    // if current page is in the middle
                    // 1 ... 6 7 8 9 10 ... 15
                } else {
                    ctrl.pages.push('...');

                    // calculate how many pages should be displayed before active page
                    // for example, there are 9 pages max, so: 1 | ... | middle group | ... | last page
                    // Middle group looks like: | visible1 | visible2 | current | visible3 | visible4
                    var firstVisiblePage = ctrl.page - Math.ceil((middleGroup - 1) / 2);

                    // calculate how many pages should be displayed after active page
                    var lastVisiblePage = ctrl.page + Math.floor((middleGroup - 1) / 2);

                    [].push.apply(ctrl.pages, lodash.range(firstVisiblePage, lastVisiblePage + 1));

                    ctrl.pages.push('...');
                }

                // Add the last page
                ctrl.pages.push(ctrl.pageData.total - 1);
            } else {

                // if there are less pages, than max allowed, display them all
                [].push.apply(ctrl.pages, lodash.range(1, ctrl.pageData.total));
            }
        }

        /**
         * Initialise values
         */
        function initValues() {
            updatePage();
            ctrl.jumpPage = String(Math.floor(ctrl.pageData.total / 2));

            if (ctrl.pageData.total > 0) {
                ctrl.jumpToPagePattern = createNumberPattern(ctrl.pageData.total);
            }

            generatePagesArray();
        }

        /**
         * Updates current page value from pageData object
         */
        function updatePage() {
            ctrl.page = ctrl.pageData.number;
        }

        /**
         * Creates a RegExp pattern that validates only numbers in the range from 1 to `upperBound`.
         * @param {number} upperBound - the maximum number to consider valid by the returned RegExp pattern.
         * @returns {RegExp} a RegExp pattern as a string, that validates a given string to be a number in the range
         *     from 1 to `upperBound`, or the empty-string (`''`) if `upperBound` is not of type `number` or if it is
         *     a non-positive number.
         */
        function createNumberPattern(upperBound) {
            var str = String(upperBound);
            var len = str.length;

            if (!angular.isNumber(upperBound) || upperBound <= 0) {
                return '';
            }

            if (len === 1) {
                return '^[1-' + str + ']$';
            }

            var patterns = ['\\d{1,' + (len - 1) + '}'];
            var lastDigits = '';
            lodash.forEach(lodash.initial(str), function (digit, index) {
                var upper = Number(digit) - 1;
                if (upper >= 0) {
                    patterns.push(lastDigits + '[0-' + upper + ']\\d{' + (len - 1 - index) + '}');
                }
                lastDigits += digit;
            });
            patterns.push(lastDigits + '[0-' + (upperBound % 10) + ']');
            return new RegExp('^(?!0+$)(' + patterns.join('|') + ')$');
        }
    }
}());
