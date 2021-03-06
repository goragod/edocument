/**
 * Datalist (component)
 * GDatalist (base class)
 *
 * @filesource js/datalist.js
 * @link http://www.kotchasan.com/
 * @copyright 2019 Goragod.com
 * @license http://www.kotchasan.com/license/
 */
(function() {
  "use strict";
  window.GDatalist = GClass.create();
  GDatalist.prototype = {
    initialize: function(text, onChanged) {
      if (!$E(text)) {
        console.log('[Datalist] Cannot find target element ' + text);
        return;
      }
      if ($E(text).getAttribute('Datalist')) {
        return;
      }
      this.input = $G(text);
      this.input.setAttribute('Datalist', true);
      this.datalist = {};
      this.onChanged = onChanged || $K.returnFuntion;
      this.input.selectedIndex = this.input.value;
      this.selectedIndex = null;
      this.changedTimeout = 0;
      this.nameValue = this.input.get('nameValue');
      if (this.nameValue === null) {
        this.nameValue = '';
        this.customText = false;
      } else {
        this.customText = true;
      }
      this.input.removeAttribute('nameValue');

      this.input.getValue = function() {
        return self.input.selectedIndex;
      };

      this.input.reset = function() {
        self.input.selectedIndex = null;
        self.selectedIndex = null;
        self.input.value = null;
      };

      var cancelEvent = false,
        showing = false,
        listindex = 0,
        list = [],
        self = this;

      this.input.setDatalist = function(datas) {
        self.datalist = {};
        for (var key in datas) {
          self.datalist[key] = datas[key];
        }
        listindex = 0;
        self.input.value = self.datalist[self.input.selectedIndex] || self.nameValue;
      };

      this.input.datalist = function(index) {
        return self.datalist[index];
      };

      this.value_change = false;
      forEach($G(this.input.list).elems('option'), function() {
        self.datalist[this.value] = this.innerText;
      });
      this.input.list.remove();
      this.input.removeAttribute('list');
      this.input.value = this.datalist[this.input.selectedIndex] || this.nameValue;
      this.dropdown = new GDropdown(this.input, {
        autoHeight: true,
        id: this.input.id + '_gautocomplete',
        className: 'gautocomplete'
      });
      var display = this.dropdown.getDropdown();

      function _movehighlight(id) {
        listindex = Math.max(0, id);
        listindex = Math.min(list.length - 1, listindex);
        var selItem = null;
        forEach(list, function() {
          if (listindex == this.itemindex) {
            this.addClass("select");
            selItem = this;
          } else {
            this.removeClass("select");
          }
        });
        return selItem;
      }

      function _onSelect() {
        if (showing) {
          _hide();
          self.input.value = self.datalist[this.key];
          self.input.selectedIndex = this.key;
          self.value_change = false;
          _doChange();
        }
      }
      var _mouseclick = function() {
        _onSelect.call(this);
        window.setTimeout(function() {
          self.input.focus();
        }, 1);
      };

      var _mousemove = function() {
        _movehighlight(this.itemindex);
      };

      function _populateitem(key, text) {
        var p = document.createElement('p');
        display.appendChild(p);
        p.innerHTML = text;
        $G(p).key = key;
        p.addEvent("mousedown", _mouseclick);
        p.addEvent("mousemove", _mousemove);
        p.itemindex = list.length;
        list.push(p);
      }

      function _hide() {
        self.dropdown.hide();
        showing = false;
      }

      var _search = function() {
        if (self.input.readOnly == false && self.input.disabled == false) {
          if (!cancelEvent) {
            display.innerHTML = "";
            var value,
              text = self.input.value,
              filter = new RegExp("(" + text.preg_quote() + ")", "gi");
            listindex = 0;
            list = [];
            if (self.datalist[self.input.selectedIndex] != text) {
              self.input.selectedIndex = null;
              self.value_change = true;
            }
            for (var key in self.datalist) {
              value = self.datalist[key];
              if (text == '') {
                _populateitem(key, value);
              } else {
                if (filter.test(value)) {
                  _populateitem(key, value.replace(filter, "<em>$1</em>"));
                }
              }
            }
            _movehighlight(0);
            if (list.length > 0) {
              window.setTimeout(function() {
                self.dropdown.show();
              }, 1);
              showing = true;
            } else {
              _hide();
            }
          }
          cancelEvent = false;
        }
      };

      function _showitem(item) {
        if (item) {
          var top = item.getTop() - display.getTop();
          var height = display.getHeight();
          if (top < display.scrollTop) {
            display.scrollTop = top;
          } else if (top >= height) {
            display.scrollTop = top - height + item.getHeight();
          }
        }
      }

      function _dokeydown(evt) {
        var key = GEvent.keyCode(evt);
        if (key == 40) {
          _showitem(_movehighlight(listindex + 1));
          cancelEvent = true;
        } else if (key == 38) {
          _showitem(_movehighlight(listindex - 1));
          cancelEvent = true;
        } else if (key == 13) {
          cancelEvent = true;
          forEach(list, function() {
            if (this.itemindex == listindex) {
              _onSelect.call(this);
            }
          });
        } else if (key == 32) {
          if (this.value == "") {
            _search();
            cancelEvent = true;
          }
        }
        if (cancelEvent) {
          GEvent.stop(evt);
        }
      }

      function _doChange() {
        if (self.selectedIndex != self.input.selectedIndex) {
          self.selectedIndex = self.input.selectedIndex;
          try {
            if (self.onChanged.call(self.input)) {
              if (self.changedTimeout == 0) {
                self.changedTimeout = window.setTimeout(function() {
                  self.changedTimeout = 0;
                  self.input.callEvent('change');
                }, 1);
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      }

      this.input.addEvent("click", _search);
      this.input.addEvent("keyup", _search);
      this.input.addEvent("keydown", _dokeydown);
      this.input.addEvent("change", function(evt) {
        window.clearTimeout(self.changedTimeout);
        self.changedTimeout = 0;
        GEvent.stop(evt);
        _doChange();
      });
      this.input.addEvent("focus", function() {
        _search();
        this.select();
      });
      this.input.addEvent("blur", function() {
        if (self.value_change) {
          if (!self.customText) {
            self.input.value = null;
          } else {
            self.nameValue = self.input.value;
            self.input.selectedIndex = null;
          }
          self.value_change = false;
          _doChange();
        }
        _hide();
      });
      $G(document.body).addEvent("click", function(e) {
        if (GEvent.element(e) != self.input) {
          _hide();
        }
      });
      _doChange();
    },
    isDatalist: function() {
      return this.input ? true : false;
    }
  };

  window.Datalist = GClass.create();
  Datalist.prototype = {
    initialize: function(text) {
      this.input = $G(text);
      this.hidden = document.createElement("input");
      this.hidden.type = 'hidden';
      var name = this.input.name || this.input.id,
        id = this.input.id || this.input.name;
      this.hidden.name = name;
      this.input.id = id;
      if (name == id) {
        this.input.name = name + '_text';
      } else {
        this.input.name = id;
      }
      this.hidden.value = this.input.value;
      var self = this,
        datalist = new GDatalist(text, function() {
          self.hidden.value = this.selectedIndex;
          return true;
        });
      if (datalist.isDatalist()) {
        this.input.parentNode.appendChild(this.hidden);
      } else {
        this.hidden = null;
      }
    }
  };
})();
