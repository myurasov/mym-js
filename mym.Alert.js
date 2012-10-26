/**
 * Alert Box
 *
 * Events:
 *  buttonClick
 *
 * (c) Mikhail Yurasov, 2012
 */

mym.Alert = function(template)
{
  mym.EventsMixin(this);

  var self = this;
  var element;
  var isOpened = false;

  function init()
  {
    element = $($(template).html()); // create element from template
    $('body').append(element); // insert element
    $('.alertFooter button', element).click(onButtonClick);
  }

  /**
   * Button is clicked
   */
  function onButtonClick()
  {
    var buttonClicked = this;
    var index = -1;

    // search for button index
    $('.alertFooter button', element).each(function(i, e){
      if (e === buttonClicked) index = i;
    });

    self.fireEvent('buttonClick', {
      button: this,
      index: index
    });

    self.close();
  }

  /**
   * Adjust vertical position
   */
  function adjustPosition()
  {
    element.css({
      'top': '50%',
      'margin-top': - element.height() / 2
    })
  }

  self.setText = function(text)
  {
    $('.alertBody', element).text(text);
    adjustPosition();
  }

  self.show = function()
  {
    if (!isOpened)
    {
      isOpened = true;

      var boxShadow = element.css('box-shadow'); // save shadow style
      var h = element.height();
      var wh = $(window).height();

      element.css({ // set initial position off screen
        'display'   : 'block',
        'box-shadow': 'none',
        'top'       : -h,
        "opacity"   : 0
      }).animate({ // show
        'top': (wh - h) / 2,
        "opacity": 1
      }, 200, function(){
        // restore shadow
        element.css('box-shadow', boxShadow);
        // position vertically in the middle
        adjustPosition();
      });
    }
  }

  self.close = function()
  {
    element.css('display', 'none');
    isOpened = false;
  }

  self.destroy = function()
  {
    element.remove();
  }

  init();
}