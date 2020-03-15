(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('SearchHelperService', SearchHelperService);

    function SearchHelperService(lodash) {
        return {
            makeSearch: makeSearch
        };

        //
        // Public methods
        //

        /**
         * Perform search of data based on text query
         * @param {string} searchQuery - text query entered to a search input
         * @param {Array.<Object>} data - array of data
         * @param {Array.<string>} pathsForSearchArray - array of keys in which search will be made
         * @param {boolean} isHierarchical - flag which indicates if passed data has hierarchical structure
         * @param {string} ruleType - string representing the type of rule resource
         * @param {Object} searchStates
         * @param {string} [multiSearchName] - unique name of the search input
         */
        function makeSearch(searchQuery, data, pathsForSearchArray, isHierarchical, ruleType, searchStates,
                            multiSearchName) {
            searchStates.searchNotFound = false;
            searchStates.searchInProgress = false;

            if (isHierarchical) {
                data = data.ui.children;
            } else {
                ruleType = '';
            }
            if (searchQuery === '') {
                showAllChildren(data, multiSearchName);
            } else if (angular.isString(searchQuery)) {
                searchStates.searchNotFound = true;
                searchStates.searchInProgress = true;
                findBySearchQuery(searchQuery, data, pathsForSearchArray, isHierarchical, ruleType, searchStates,
                                  multiSearchName);
            }
        }

        //
        // Private methods
        //

        /**
         * Loop through all given data to show/hide them depending on query match criteria (recursively)
         * @param {string} searchQuery - text query entered to a search input
         * @param {Array.<Object>} children - array of child data
         * @param {Array.<string>} pathsForSearch - array of strings, representing data's properties keys to search from
         * @param {boolean} isHierarchical - flag which indicates if passed data has hierarchical structure
         * @param {string} ruleType - string representing the type of rule resource
         * @param {Object} searchStates
         * @param {string} [multiSearchName] - unique name of the search input
         */
        function findBySearchQuery(searchQuery, children, pathsForSearch, isHierarchical, ruleType, searchStates,
                                   multiSearchName) {
            angular.forEach(children, function (child) {
                // Search by text in data without children data only
                if (angular.isString(child.type) && (child.type !== ruleType) && isHierarchical) {
                    // Hide all parent data while search among children and proceed recursively
                    child.ui.isFitQuery = false;
                    findBySearchQuery(searchQuery, child.ui.children, pathsForSearch, isHierarchical, ruleType,
                                      searchStates, multiSearchName);
                } else {
                    showRelevantItem(searchQuery, child, pathsForSearch, searchStates, multiSearchName);
                }
            });
        }

        /**
         * Get all current item's properties string values and push to stringValuesArray (recursively)
         * @param {string} itemPropertyValue - item's attribute value
         * @param {Array} stringValuesArray - array to collect current item's all properties string values
         */
        function getStringValuesFromItem(itemPropertyValue, stringValuesArray) {
            if (angular.isObject(itemPropertyValue)) {
                angular.forEach(itemPropertyValue, function (value) {
                    getStringValuesFromItem(value, stringValuesArray);
                });
            } else if ((angular.isString(itemPropertyValue) && itemPropertyValue.length > 0) || angular.isNumber(itemPropertyValue)) {
                stringValuesArray.push(itemPropertyValue.toString());
            }

            return stringValuesArray;
        }

        /**
         * Sets isFitQuery value for data item
         * @param {Object} dataItem - current item
         * @param {string} [multiSearchName] - unique name of the search input
         * @param {boolean} isFitQuery - `true` if item is matched with search query
         */
        function setFitQueryValue(dataItem, multiSearchName, isFitQuery) {
            var filterPath = lodash.isEmpty(multiSearchName) ?
                'isFitQuery' : ['filters', multiSearchName, 'isFitQuery'];

            lodash.set(dataItem.ui, filterPath, isFitQuery);
        }


        /**
         * Show all data item's children chain (recursively)
         * @param {Array.<Object>} data - child items
         * @param {string} [multiSearchName] - unique name of the search input
         */
        function showAllChildren(data, multiSearchName) {
            angular.forEach(data, function (value) {
                var children = value.ui.children;

                setFitQueryValue(value, multiSearchName, true);

                if (!lodash.isEmpty(children)) {
                    showAllChildren(children);
                }
            });
        }

        /**
         * Show item's all direct ancestors chain (recursively)
         * @param {Object} dataItem - current item
         */
        function showAllParents(dataItem) {
            var parent = dataItem.ui.parent;
            if (angular.isDefined(parent)) {
                parent.ui.isFitQuery = true;
                showAllParents(parent);
            }
        }

        /**
         * Loop through all given data's properties and show/hide current data depending on query match criteria
         * @param {string} searchQuery - query entered to a search input
         * @param {Object} dataItem - current item
         * @param {Array} pathsForSearch - array of strings, representing paths to item's properties to search from
         * @param {Object} searchStates
         * @param {string} [multiSearchName] - unique name of the search input
         */
        function showRelevantItem(searchQuery, dataItem, pathsForSearch, searchStates, multiSearchName) {
            var isFitQuery;
            var stringValuesArray = [];

            angular.forEach(pathsForSearch, function (pathForSearch) {
                getStringValuesFromItem(lodash.get(dataItem, pathForSearch), stringValuesArray);
            });

            // If at least one value in item's properties string values matched - show current item and all its direct ancestors chain
            isFitQuery = stringValuesArray.some(function (value) {
                return lodash.includes(value.toLowerCase(), searchQuery.toLowerCase());
            });

            setFitQueryValue(dataItem, multiSearchName, isFitQuery);

            if (dataItem.ui.isFitQuery) {
                searchStates.searchNotFound = false;
                showAllParents(dataItem);
            }
        }
    }
}());
