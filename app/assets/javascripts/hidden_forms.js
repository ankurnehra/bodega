// Set up forms whose visibility can be toggled on/off.
//
// Usage: `new BODEGA.HiddenForm(selector[, options])`
//
// Required DOM structure:
//
//   master container(data-resource="[resource]")
//     rendered container(.form_rendered)
//       rendered content
//     form container(.form_container)
//       show <button>
//       <form>
//         hide <button>
//
//   * The 'Show Form' button must directly precede the form.
//   * The 'Hide Form' button must be the form's last <button> descendant.
//   * The form must be contained in a <div>.
//   * The page content for the data that the form modifies must directly
//     precede that <div>.
//   * In order for form field validation hints to work,
//     the form itself must belong to the class "[resource]_form".
//
// Required API response objects:
//
//   * `flash`: a message to be displayed on the resulting page.
//     (format: `{ [type]: [message] }`)
//   * `rerender`: new content for the page, and the selector it will replace.
//     (format: `{ replace: [object], with: [rendered_content] }` or
//     `{ append: [rendered_content], to: [object], needsListener: [boolean] }`)
//   * `errors`: messages about which form fields failed validation and why.
//     (format: provided by ActiveRecord #errors)
//
// Options:
//
//   * `search`: parameters for the /search API request (`model` and `filter`)

BODEGA.HiddenForm = function(selector, options) {
// Init ------------------------------------------------------------------------
  this.container = $(selector);

  if (this.container.length > 1) {
    this.container.each(function(i, el) { new BODEGA.HiddenForm(el); });
  } else if (this.container.length) {
    this.form     = this.container.children('.form_container').children('form');
    this.showBtn  = this.container.children('.form_container').children('button');
    this.hideBtn  = this.form.find('button').last();
    this.rendered = this.container.children('.form_rendered');
    this.resource = this.container.data().resource;

    this._attachListeners();
    if (options && options.search) {
      var that = this;
      new BODEGA.Autocomplete(that.form, options.search, {
        select: function(event, ui) {
          $(this).val(ui.item.name).next().val(ui.item.id);
          $(this).parent().submit();
        }
      });
    }
  }
};

BODEGA.HiddenForm.prototype = {
// Listeners -------------------------------------------------------------------
  _attachListeners: function() {
    var that = this;

    this.form.addClass('hidden');

    // “Add/Edit” Button
    this.showBtn.click(function() {
      that.showBtn.addClass('hidden');
      that.form.removeClass('hidden');
      that.rendered.addClass(that.showBtn.text().match(/^edit/i) ? 'hidden' : '');
      that.form.find('input[type="text"]').first().focus();
    });

    // “Cancel” Button
    this.hideBtn.click(function(e) {
      that.form.addClass('hidden');
      that.showBtn.removeClass('hidden');
      that.rendered.removeClass('hidden');
      e.preventDefault();
    });

    // “Create/Update” Button
    this.form.on('ajax:success', function(event, data) {
      // Toggle visibility
      that.form.addClass('hidden');
      that.showBtn.removeClass('hidden');
      that.rendered.removeClass('hidden');

      // Reset form field values
      if (that.resource && data.formFields) {
        for (field in data.formFields) {
          that.form.find('input[name="' + that.resource + '[' + field + ']"]')
            .attr('value', data.formFields[field]);
        }
      }
      that.form.trigger('reset');

      // Reset form field hints
      that._resetHints();

      // Reset form buttons
      that.form.children('.actions').children().removeAttr('disabled');

      // Display flash message
      if (data.flash) {
        BODEGA.flash.display(data.flash);
      }

      // Rerender content
      if (data.rerender) {
        data.rerender = [].concat(data.rerender);

        for (var i = 0; i < data.rerender.length; i++) {
          if ('replace' in data.rerender[i] && 'with' in data.rerender[i]) {
            eval(data.rerender[i].replace).empty().append(data.rerender[i].with);
          } else if ('append' in data.rerender[i] && 'to' in data.rerender[i]) {
            eval(data.rerender[i].to).append(data.rerender[i].append);

            // Attach new listeners
            if (data.rerender[i].needsListeners) {
              var newForm = eval(data.rerender[i].to).children().last().get(0);
              if (! $._data(newForm, 'events')) { new BODEGA.HiddenForm($(newForm)); }
            }
          }
        }
      }
    });

    this.form.on('ajax:error', function(event, xhr, status, error) {
      if (xhr.responseJSON.flash) {
        BODEGA.flash.display(xhr.responseJSON.flash);
      }
      if (that.resource && xhr.responseJSON.errors) {
        that._showHints(xhr.responseJSON.errors, that.resource);
      }
    });
  },

// Helper Methods --------------------------------------------------------------
  _showHints: function(errors, scope) {
    this._resetHints();

    for (field in errors) {
      var input = this.container.find("input[name='" + scope + "[" + field + "]']"),
          label = input.prev('label'),
          hint  = (' (' + errors[field].join(', ') + ')');

      input.wrap($('<div/>', { class: 'field_with_errors' }));
      label.append($('<span/>', { class: 'field_error_msg', text: hint }));
    }
  },

  _resetHints: function() {
    this.container.find(".field_with_errors").each(function(i, el) {
      var errorWrapper = $(el);
      errorWrapper.replaceWith(errorWrapper.contents());
    });
    this.container.find(".field_error_msg").remove();
  }
};
