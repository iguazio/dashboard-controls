(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzActionItemMore', {
            bindings: {
                actions: '<?',
                onFilesDropped: '<?'
            },
            templateUrl: 'igz_controls/components/action-item/action-item-more/action-item-more.tpl.html',
            controller: IgzActionItemMore,
            transclude: true
        });

    function IgzActionItemMore($element, $document, $scope) {
        var ctrl = this;

        ctrl.isDropdownShown = false;

        ctrl.toggleTemplate = toggleTemplate;

        //
        // Public methods
        //

        /**
         * Shows/hides sub-template
         */
        function toggleTemplate() {
            ctrl.isDropdownShown = !ctrl.isDropdownShown;
            if (ctrl.isDropdownShown) {
                attachDocumentEvent();
            } else {
                detachDocumentEvent();
            }
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', hideSubtemplate);
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', hideSubtemplate);
        }

        /**
         * Hides sub-template dropdown when user clicks outside it
         * @param {MouseEvent} event
         */
        function hideSubtemplate(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    ctrl.isDropdownShown = false;
                    detachDocumentEvent();
                }
            });
        }
    }
}());
