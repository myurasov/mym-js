/**
 * Modal dialog
 *
 * Events:
 *  open
 *  close
 *  buttonClick {button: element}
 *  load
 *  afterLoad
 *  tabClick
 *
 * @copyright 2012, Mikhail Yurasov
 */

if (typeof mym == "undefined") mym = {};

mym.Modal = function (element) {
  // .addEventListener()
  // .removeEventListener()
  // .fireEvent()
  mym.EventsMixin(this);

  var self = this;
  var isOpened = false;
  var $element, $window, $container, $spinner;
  var minHeight, maxHeight;
  var marginTop, marginBottom;
  var bodyOverflow;
  var spinnerIsVisible = false;

  self.$element = null;

  function _init() {
    // cache dom references

    // create element
    var template = $(element).html();
    self.$element = $element = $(template);
    $(document.body).append($element);

    $window = $(window);
    $container = $('.modalContent > .container', $element);
    $spinner = $('.modalContent .spin', $element)

    // read parameters
    maxHeight = parseInt($element.css('max-height'));
    minHeight = parseInt($element.css('min-height'));
    marginTop = parseInt($element.css('margin-top'));
    marginBottom = parseInt($element.css('margin-bottom'));

    // reset margins
    $element.css({
      'margin-top': 0,
      'margin-bottom': 0
    });

    // close header button
    $('.modalHeader .closeButton', $element).click(function () {
      self.close();
    });

    // close footer button
    $('.modalFooter button[_close]', $element).click(function () {
      self.close();
    });

    // fire buttonClicked events
    $('.modalFooter button', $element).click(function () {
      self.fireEvent('buttonClick', {
        button: this
      });
    });

    // close when background is clicked
    $('.modalBg', $element).click(function () {
      self.close();
    });

    // handle escape key
    $(document).keydown(function (e) {
      if (e.keyCode == 27) self.close();
    })

    // handle tabs
    $('.tabs .tab', $element).mousedown(function () {
      $('.tabs .tab', $element).removeClass('selected');
      $(this).addClass('selected');
      self.fireEvent('tabClick', {
        target: this,
        index: $(this).index()
      });
      showScreen($(this).index());
    });

    // add resize handler
    $window.resize(resize);
  }

  /**
   * Executes code in "_autosize" attribute
   */
  self.autoSize = function () {
    $('*[_autosize]', $element).each(function () {
      var statement = $(this).attr('_autosize');
      var f = new Function(statement);
      f.call(this);
    });
  }

  function showScreen(index) {
    var screenToShow = $('.screens .screen:nth-child(' + (index + 1) + ')', $element);

    if (!screenToShow.hasClass('selected')) {
      // hide current screen
      $('.screens .screen.selected', $element).animate({
        opacity: 0
      }, 250).removeClass('selected');

      // show selected
      $('.screens .screen:nth-child(' + (index + 1) + ')', $element).animate({
        opacity: 1
      }, 250).addClass('selected');
    }
  }

  function show(done, openingEffect) {
    // opening animation
    if (!isOpened) {
      openingEffect = openingEffect || 'slide';

      var viewportHeight = $window.height() - marginBottom - marginTop;
      var modalHeight = Math.min(viewportHeight, maxHeight);
      var boxShadow = $element.css('box-shadow');

      if (openingEffect == 'unfold') {
        $element.css({
          top: (viewportHeight - minHeight) / 2 + marginTop,
          height: minHeight,
          display: 'block',
          'box-shadow': 'none' // remove shadow
        });

        $element.animate({
          height: modalHeight,
          top: (viewportHeight - modalHeight) / 2 + marginTop
        }, 250, function () {
          $element.css({
            'box-shadow': boxShadow
          }); // restore shadow
          if (undefined !== done) done();
        });
      } else if (openingEffect == 'slide') {
        $element.css({
          top: -modalHeight,
          height: modalHeight,
          'box-shadow': 'none',
          display: 'block'
        });

        $element.animate({
          top: (viewportHeight - modalHeight) / 2 + marginTop
        }, 250, function () {
          $element.css({
            'box-shadow': boxShadow
          });
          if (undefined !== done) done();
        });
      }
    }
  }

  function resize() {
    if (isOpened) {
      var viewportHeight = $window.height() - marginBottom - marginTop;
      var modalHeight = Math.min(viewportHeight, maxHeight);

      // set size
      $element.css({
        top: (viewportHeight - modalHeight) / 2 + marginTop,
        height: modalHeight
      });

      moveSpinner();
      self.autoSize();
      self.fireEvent('resize');
    }
  }

  // move spinner
  function moveSpinner() {
    if (spinnerIsVisible) {
      $spinner.css({
        top: $('.modalContent', $element).height() / 2
      });
    }
  }

  function showSpinner() {
    spinnerIsVisible = true;
    moveSpinner();
    $spinner.animate({
      opacity: 1
    }, 250);
  }

  function hideSpinner() {
    $spinner.animate({
      opacity: 0
    }, 250, function () {
      spinnerIsVisible = false;
    });
  }

  /**
   * Open dialog
   *
   * Effects: unfold, slide
   */
  self.open = function (options) {
    if (undefined === options) options = {};

    var contentLoaded = true;

    if (!isOpened) {
      //disableBodyScrolling();
      show(function () {
        self.autoSize();
        self.fireEvent('resize');

        if (undefined !== options.url && !contentLoaded) showSpinner();

      }, options.effect);

      isOpened = true;
      self.autoSize();
      self.fireEvent('open');
    }

    // load content
    if (undefined !== options.url) {
      contentLoaded = false;

      $container.css({
        opacity: 0
      }).html('');

      $.ajax({
        url: options.url,
        data: options.params,
        success: function (data) {
          $container.html(data).animate({
            opacity: 1
          });
          self.autoSize();
          contentLoaded = true;
          self.fireEvent('load', {
            url: this.url
          });
          self.fireEvent('afterLoad', {
            url: this.url
          });
          hideSpinner();
        },
        error: function () {
          contentLoaded = true;
          hideSpinner();
        }
      })
    }
  }

  self.close = function () {
    if (isOpened) {
      if (false !== self.fireEvent('beforeClose')) {
        //restoreBodyScrolling();
        isOpened = false;
        $element.css({
          display: 'none'
        });
        self.fireEvent('close');
      }
    }
  }

  self.setTitle = function (newTitle) {
    $('.modalTitle', $element).text(newTitle);
  }

  function disableBodyScrolling() {
    bodyOverflow = $('body').css('overflow');
    $('body').css('overflow', 'hidden');
  }

  function restoreBodyScrolling() {
    $('body').css('overflow', bodyOverflow);
  }

  _init();
}