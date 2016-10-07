/**
 * https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
 * 
 * Shim for "fixing" IE's lack of support (IE < 9) for applying slice
 * on host objects like NamedNodeMap, NodeList, and HTMLCollection
 * (technically, since host objects have been implementation-dependent,
 * at least before ES6, IE hasn't needed to work this way).
 * Also works on strings, fixes IE < 9 to allow an explicit undefined
 * for the 2nd argument (as in Firefox), and prevents errors when
 * called on other DOM objects.
 */
(function () {
  'use strict';
  var _slice = Array.prototype.slice;

  try {
    // Can't be used with DOM elements in IE < 9
    _slice.call(document.documentElement);
  } catch (e) { // Fails in IE < 9
    // This will work for genuine arrays, array-like objects, 
    // NamedNodeMap (attributes, entities, notations),
    // NodeList (e.g., getElementsByTagName), HTMLCollection (e.g., childNodes),
    // and will not fail on other DOM objects (as do DOM elements in IE < 9)
    Array.prototype.slice = function(begin, end) {
      // IE < 9 gets unhappy with an undefined end argument
      end = (typeof end !== 'undefined') ? end : this.length;

      // For native Array objects, we use the native slice function
      if (Object.prototype.toString.call(this) === '[object Array]'){
        return _slice.call(this, begin, end); 
      }

      // For array like object we handle it ourselves.
      var i, cloned = [],
        size, len = this.length;

      // Handle negative value for "begin"
      var start = begin || 0;
      start = (start >= 0) ? start : Math.max(0, len + start);

      // Handle negative value for "end"
      var upTo = (typeof end == 'number') ? Math.min(end, len) : len;
      if (end < 0) {
        upTo = len + end;
      }

      // Actual expected size of the slice
      size = upTo - start;

      if (size > 0) {
        cloned = new Array(size);
        if (this.charAt) {
          for (i = 0; i < size; i++) {
            cloned[i] = this.charAt(start + i);
          }
        } else {
          for (i = 0; i < size; i++) {
            cloned[i] = this[start + i];
          }
        }
      }

      return cloned;
    };
  }
}());
jQuery(function($){
	var config = window.codeshell_config || {};

	var $lang_chg_form = $("form#lang_chg_form");
	// var current_uri = new URL(location.href);
	// var root_path = config.root_path || "/";

	function show_msg(msg) {
		// TODO implement modaless
		return alert(msg);
	}

	// Allows to specify ANY ids without escaping
	// Assumes the document conforms to the standard (every element has an unique id)
	function $by_id(id) {
		var elem;
		if (document.getElementById)
			elem = document.getElementById(id);
		else
			elem = document.all[id];
		if (elem === null || typeof(elem) === "undefined")
			return $([]);
		else
			return $(elem);
	}

	// TODO If sites grows heavier, implement page loads through AJAX.
	//	if AJAX-supported, not on main page AND no history support, redirect browser to main page with hashbangs referring to this page
	//	if hashbangs with query strings...?

	$("select[name=language]", $lang_chg_form).change(function(ev) {
		$(this).parent("form").submit();
	});
	$("input[type=submit]", $lang_chg_form).hide();

	(function() {
		var close_btn = $('<a href="#" class="close_btn" title="Close">X</a>');
		close_btn.click(function(ev) {
			$(this).parent("li").stop(true, true).animate({opacity: 0}).slideUp(450, function(){$(this).remove();});
		});
		$("#messages li:not(.hasclose)").append(close_btn).addClass("hasclose");
	})();

	var add_onhashchange = (function() {
		var handleres = null;
		function add_onhashchange(handler) {
			if (window.addEventListener) {
				window.addEventListener("hashchange", handler);
			} else if (window.attachListener) {
				window.attachListener("hashchange", handler);
			} else {
				if (!handlers) {
					handlers = [];
					window.onhashchange = function() {
						var args = Array.prototype.slice.call(arguments);
						for (var i = 0; i < handlers.length; i++) {
							handlers.apply(args);
						}
					}
				}
				handlers[handlers.length] = handler;
			}
		}
		return add_onhashchange;
	})();

	(function() {
		chall_details = $(".chall_details");
		if (!chall_details || !chall_details.length) return;
		$(".chall_details").addClass("as_popup");
		var popup_back = $('<div class="popup_back"></div>');
		$("body").append(popup_back);
		var close_btn = $('<a href="#" class="close_btn" title="Close">X</a>');
		var speed = 400;
		function hide_popup() {
			popup_back.filter(".shown").add(".chall_details .chall_embedded.shown").stop(true, true).removeClass("shown").fadeOut(speed);
		}
		close_btn.add(popup_back).click(function(ev) {
			hide_popup();
			location.hash = "";
		});
		$(".chall_details .chall_embedded").prepend(close_btn);
		
		function onhashchange(ev) {
			var hash = (location.hash || "").replace(/^#/, '');

			if (hash) {
				var elem = $by_id(hash).filter(".chall_embedded:not(.shown)");
				if (elem && elem.length) {
					$(".chall_details .chall_embedded.shown").not(elem).stop(true, true).fadeOut(speed);
					popup_back.not(".shown").add(elem).stop(true, true).addClass("shown").fadeIn(speed);
				}
			} else {
				hide_popup();
			}
			return true;
		}
		add_onhashchange(onhashchange);
		$(".chall_details li a").click(onhashchange);
		onhashchange(); // Fire hash 'change' event to check whether any special hash is visited.
	})();

	(function() {
		var is_shown = true;
		function showsel_onchange(ev) {
			var status_sel = $(".search_user_fdset .search_status");
			if (!status_sel) return true;
			var val = status_sel.val();
			if (is_shown == !!val) return true;
			is_shown = !!val;
			var by_user = $(".search_user_fdset .search_by_user");
			var speed = typeof(ev) === "undefined" ? 0 : 200;
			if (val) by_user.slideDown(speed);
			else by_user.slideUp(speed);
		}
		$(".search_user_fdset .search_status").change(showsel_onchange).keyup(showsel_onchange);
		showsel_onchange();
	})();

	(function() {
		if (!$(".new_table").length) return;
		function onhashchange(ev) {
			var hash = (location.hash || "").replace(/^#/, '');
			var rows = $(".new_table tr"), sel = $by_id(hash);
			rows.filter(".highlight").not(sel).removeClass("highlight");
			if (hash) sel.filter(rows).addClass("highlight");
		}
		add_onhashchange(onhashchange);
		onhashchange();
	})();
});
