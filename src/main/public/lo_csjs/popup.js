$(document).ready(function() {
  function popupImage(pinum) {
    var popup = document.getElementById('js-popup' + pinum);
    if(!popup) return;

    var blackBg = document.getElementById('js-black-bg' + pinum);
    var closeBtn = document.getElementById('js-close-btn' + pinum);
    var showBtn = document.getElementById('js-show-popup' + pinum);

    closePopUp(blackBg);
    closePopUp(closeBtn);
    closePopUp(showBtn);
    function closePopUp(elem) {
      if(!elem) return;
      elem.addEventListener('click', function() {
        popup.classList.toggle('is-show');
      });
    }
  
  }

  popupImage('');
  popupImage(2);
  popupImage(3);
  popupImage(4);
  popupImage(5);
});