$(document).ready(function () {
  // START IN BIG OF PAGE
  window.scrollTo(0, 0);

  // ROTATE PLANET ON SCROLL
  $(window).scroll(function () {
    var offset = $(window).scrollTop();
    offset = offset * 0.05;
    $(".planet").css({
      "-moz-transform": "rotate(-" + offset + "deg)",
      "-webkit-transform": "rotate(-" + offset + "deg)",
      "-o-transform": "rotate(-" + offset + "deg)",
      "-ms-transform": "rotate(-" + offset + "deg)",
      transform: "rotate(-" + offset + "deg)",
    });
  });

  // CLICK FUNCT
  $(".ajfel").click(function () {
    window.scrollTo(0, 0);
    $(".bus").removeClass("bus-bottom");
  });
  $(".wash").click(function () {
    window.scrollTo(0, 400);
    $(".bus").removeClass("bus-bottom");
  });
  $(".rus").click(function () {
    window.scrollTo(0, 950);
    $(".bus").removeClass("bus-forward");
    $(".bus").addClass("bus-bottom");
  });
  $(".build").click(function () {
    window.scrollTo(0, 1350);
    $(".bus").removeClass("bus-bottom");
    $(".bus").addClass("bus-top");
  });
  $(".prus").click(function () {
    window.scrollTo(0, 1800);
    $(".bus").removeClass("bus-top");
    $(".bus").addClass("bus-back");
  });
  $(".germ").click(function () {
    window.scrollTo(0, 2400);
    $(".bus").removeClass("bus-back");
    $(".bus").addClass("bus-forward");
  });
  $(".crkv").click(function () {
    window.scrollTo(0, 2910);
    $(".bus").removeClass("bus-forward");
    $(".bus").addClass("bus-bottom");
  });
  $(".krist").click(function () {
    window.scrollTo(0, 3190);
    $(".bus").removeClass("bus-bottom");
    $(".bus").addClass("bus-forward");
  });
  $(".piramid").click(function () {
    window.scrollTo(0, 3630);
    $(".bus").removeClass("bus-forward");
    $(".bus").addClass("bus-bottom");
  });
  $(".arab").click(function () {
    window.scrollTo(0, 3990);
    $(".bus").removeClass("bus-bottom");
    $(".bus").addClass("bus-back");
  });
  $(".relg").click(function () {
    window.scrollTo(0, 4360);
    $(".bus").removeClass("bus-back");
    $(".bus").addClass("bus-top");
  });
  $(".pope").click(function () {
    window.scrollTo(0, 4700);
    $(".bus").removeClass("bus-top");
    $(".bus").addClass("bus-bottom");
  });
  $(".bigben").click(function () {
    window.scrollTo(0, 4950);
    $(".bus").removeClass("bus-bottom");
    $(".bus").addClass("bus-forward");
  });
  $(".bridge").click(function () {
    window.scrollTo(0, 5400);
    $(".bus").removeClass("bus-forward");
    $(".bus").addClass("bus-bottom");
  });
  $(".germ2").click(function () {
    window.scrollTo(0, 5950);
    $(".bus").removeClass("bus-bottom");
    $(".bus").addClass("bus-back");
  });
  $(".rom").click(function () {
    window.scrollTo(0, 6400);
    $(".bus").removeClass("bus-back");
    $(".bus").addClass("bus-forward");
  });
  $(".chrch").click(function () {
    window.scrollTo(0, 6750);
    $(".bus").addClass("bus-back");
  });
});
