// ==UserScript==
// @name       TISS Registration Madness
// @namespace  JuHwon
// @version    1.0
// @description  Just Madness
// @match      https://tiss.tuwien.ac.at/*
// @copyright  2016+, JuHwon
// @require    http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

(function TissRegistrationMadnessClass() {
    var me = this;

    var options = {
        // option do enable autoregistration
        autoRegistration: true,

        // option to enable autoreload if the reigster button is not available
        autoReload: false,

        // interval to refresh the page if register button not available
        refreshInterval: 1000,

        // course number
        courseNumber: '188.916',

        // type of registration, available options: lva, group, exam
        registrationType: 'lva',

        // section of registration button, e.g. group name like "Gruppe 3", or name of exam
        // this option is not available with the registration type 'lva'
        registerSection: '',

        // semester of the desired course
        semester: '2016W',

        // if you got multiple study codes, configure the desired one without the dot (e.g. 033526)
        studyCode: ''
    };

    var state = {
        NONE: 0,
        SUCCESS: 1,

        // errors
        WRONG_COURSE: 10,
        WRONG_SEMESTER: 11,
        WRONG_TAB: 12,

        // not found
        SECTION_NOTFOUND: 20,
        BUTTON_NOTFOUND: 21
    };

    var tabs = {
        lva: 'LVA-Anmeldung',
        group: 'Gruppe',
        exam: 'Prüfung'
    };

    var LOG_AREA_SYLE = 'color: black; background-color: #FFFCD9; font-size: 10pt;';
    var LOG_AREA_ID = 'trmLog';
    var ERROR_AREA_STYLE = 'color: red; font-weight: bold; font-size: 14pt; padding: 8px 0px;';
    var ERROR_AREA_ID = 'trmError';
    var SUCCESS_AREA_STYLE = 'color: green; font-weight: bold; font-size: 14pt; padding: 8px 0px;';
    var SUCCESS_AREA_ID = 'trmSuccess';

    this.init = function() {
        me.state = state.NONE;
        me.extendJQuery();
        me.injectArea(LOG_AREA_ID, LOG_AREA_SYLE, 'Information Log');
        me.injectArea(ERROR_AREA_ID, ERROR_AREA_STYLE);
        me.injectArea(SUCCESS_AREA_ID, SUCCESS_AREA_STYLE);
        me.start();
    };

    this.start = function() {
        me.pageLog('TISS Registration Madness started');
        me.pageLog('LVA Number: ' + me.getLvaNumber());
        me.pageLog('LVA Name: ' + me.getLvaName());
        me.pageLog('SelectedTab: ' + me.getSelectedTab());

        var properTabSelected = me.properTabSelected();
        var studySelection = me.getStudySelection();
        var confirmButton = me.getConfirmButton();
        var alreadyRegistered = me.checkIfRegistered();

        //TODO: check LVA number

        if(me.properSemesterSelected() && !alreadyRegistered) {
            // check registration step
            if (properTabSelected) {
                me.register();
            } else if (studySelection) {
                me.studySelection(studySelection);
            } else if (confirmButton) {
                me.confirm(confirmButton);
            } else {
                me.pageError('Could not determine registration step.');
            }
        }

        switch(me.state) {
            case state.SUCCESS:
                me.pageSuccess('You are successfully logged in.');
                break;
            case state.WRONG_COURSE:
                me.pageError('Wrong course selected. Expected: ' + options.courseNumber);
                break;
            case state.WRONG_SEMESTER:
                me.pageError('Wrong semester selected. Expected: ' + options.semester);
                break;
            case state.WRONG_TAB:
                me.pageError('Wrong Tab selected. Tab did not match ' + tabs[options.registrationType]);
                break;
            case state.SECTION_NOTFOUND:
                me.pageError('Could not find section with title "' + options.registerSection + '"');
                break;
            case state.BUTTON_NOTFOUND:
                me.pageError('Could not find register button.');
                break;
        }
    };

    this.register = function() {
        if(!me.properCourseSelected()) {
            return;
        }

        if (options.registrationType == 'lva') {
            options.registerSection = 'LVA-Anmeldung';
        }

        var sectionLabel = this.getSectionLabel();
        var section = sectionLabel.closest('.groupWrapper');
        if (!section) {
            me.state = state.SECTION_NOTFOUND;
            return;
        }

        me.highlightElement(sectionLabel);

        var registerButton = me.getRegisterButton(section);
        if (!registerButton) {
            me.state = state.BUTTON_NOTFOUND;
            if (options.autoReload) {
                setTimeout(function() { location.reload(); }, options.refreshInterval);
            }
            return;
        }
        me.highlightElement(registerButton);

        if (options.autoRegistration) {
            registerButton.click();
        }
    };

    this.studySelection = function(selection) {
        me.pageError('');
       if (options.studyCode) {
            me.setSelectedValue(selection, options.studyCode);
       }
       var registerButton = me.getRegisterButton($('form#regForm'));
       me.highlightElement(registerButton);
       if (options.autoRegistration) {
            registerButton.click();
       }
    };

    this.confirm = function(button) {
        me.pageError('');
        me.highlightElement(button);
        if (options.autoRegistration) {
            button.click();
        }
    };

    this.checkIfRegistered = function() {
        if (options.registrationType == 'lva') {
            options.registerSection = 'LVA-Anmeldung';
        }

        var sectionLabel = this.getSectionLabel();
        var section = sectionLabel.closest('.groupWrapper');
        if (!section) {
            return false;
        }

        me.highlightElement(sectionLabel);

        var deregisterButton = me.getDeregisterButton(section);
        if (!deregisterButton) {
            return false;
        }
        me.state = state.SUCCESS;
        return true;
    };

///////////////////////// Props

    var _lvaNumber;
    this.getLvaNumber = function() {
       return _lvaNumber || (_lvaNumber = $('#contentInner h1 span:first').text().trim());
    };

    var _lvaName;
    this.getLvaName = function() {
        return _lvaName || (_lvaName = $('#contentInner h1').justtext());
    };

    var _selectedTab;
    this.getSelectedTab = function() {
        return _selectedTab || (_selectedTab = $('li.ui-tabs-selected').text().trim());
    };

    var _sectionLabel;
    this.getSectionLabel = function() {
        if (!_sectionLabel) {
            _sectionLabel = $(".groupWrapper .header_element span").filter(function () {
                return $(this).text().trim() === options.registerSection;
            });
        }
        return _sectionLabel;
    };

    var _section;
    this.getSection = function() {
        return _section || (_section = me.getSectionLabel().closest('.groupWrapper'));
    };

    var _confirmButton;
    // returns null if button is not found
    this.getConfirmButton = function() {
        var button = _confirmButton || (_confirmButton = $("form#confirmForm input:submit[value='Ok']"));
        return button.length === 0 ? null : button;
    };

    var _registerButton;
    // returns null if button is not found
    this.getRegisterButton = function(section) {
        if (!_registerButton) {
            _registerButton = $(section).find('input:submit[value="Anmelden"]');

            // fallback solutions, since it seems the value is not always the same
            if (_registerButton.length === 0) {
                _registerButton = $(section).find('input:submit[value="Voranmelden"]');
            }

            if (_registerButton.length === 0) {
                _registerButton = $(section).find('input:submit[value="Voranmeldung"]');
            }
        }

        return _registerButton.length === 0 ? null : _registerButton;
    };

    var _studySelection;
    // returns null if button is not found
    this.getStudySelection = function() {
        var selection = _studySelection || (_studySelection = $("#regForm").find('select[name="regForm:studyCode"]'));
        return selection.length === 0 ? null : selection;
    };

    var _deregisterButton;
    // returns null if button is not found
    this.getDeregisterButton = function(section) {
        var button = _deregisterButton || (_deregisterButton || $(section).find('input:submit[value="Abmelden"]'));
        return button.length === 0 ? null : button;
    };

//////////////////////// Util

    this.highlightElement = function(element) {
        element.css('background-color', 'lightgreen');
    };

    this.setSelectedValue = function (element, value) {
        element.find('option').removeAttr('selected');
        element.find('option[value="' + value + '"]').attr('selected', 'selected');
    };

    this.pageError = function(msg) {
        var errorLog = $('#' + ERROR_AREA_ID);
        errorLog.html(msg);
    };

    this.pageSuccess = function(msg) {
        var successLog = $('#' + SUCCESS_AREA_ID);
        successLog.html(msg);
    };

    this.pageLog = function(msg) {
        var log = $('#' + LOG_AREA_ID);
        log.html(log.html() + '<br />' + msg);
    };

    this.injectArea = function(id, style, title) {
        $('#contentInner').before(
            '<div id="' + id + '" style="' + style + '">' +
                (title ? '<h2>' + title + '</h2>' : '') +
            '</div>'
        );
    };

    this.extendJQuery = function() {
        jQuery.fn.justtext = function() {
            //todo remove this in future
            return $(this).clone()
                .children()
                .remove()
                .end()
                .text()
                .trim();
        };
    };

    //////////////////////// Validation

    this.properCourseSelected = function() {
        var lvaNumber = me.getLvaNumber().replace(/[^\d]/, '');
        if (lvaNumber !== options.courseNumber.replace(/[^\d]/, '')) {
            me.state = state.WRONG_COURSE;
            return false;
        }
        return true;
    };

    this.properSemesterSelected = function() {
        var subheader = $('#contentInner #subHeader').text().trim();
        if (subheader.indexOf(options.semester) === -1) {
            me.state = state.WRONG_SEMESTER;
            return false;
        }
        return true;
    };

    this.properTabSelected = function() {
        if (me.getSelectedTab() !== tabs[options.registrationType]) {
            me.state = state.WRONG_TAB;
            return false;
        }
        return true;
    };

    this.init();
})();