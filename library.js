"use strict";

const winston = require.main.require("winston");
const meta = require.main.require("./src/meta");
const controllers = require("./lib/controllers");
const routeHelpers = require.main.require("./src/routes/helpers");
const Benchpress = require.main.require("benchpressjs");
const sanitizeHtml = require.main.require("sanitize-html");
const validator = require.main.require("validator");

// The numbers represent the interstitial index number and grouping of fields
const defaultCustomFields = {
  0: {
    fullname: {
      label: "Full Name",
      placeholder: "John Smith",
      help_text: "",
      type: "text",
      validation_type: "name",
      required: true,
      autocomplete: "name",
    },
    phone: {
      label: "Phone Number",
      placeholder: "+919848249183",
      help_text:
        "Include the country code, such as +1 for the US/Canada or +91 for India, to ensure accurate contact information.",
      type: "text",
      validation_type: "phone",
      required: true,
      autocomplete: "tel",
    },
  },
  1: {
    current_address: {
      label: "City of Current Residence",
      placeholder: "Bangalore",
      help_text:
        "Please provide your current location. We will keep this information confidential and only use it for necessary communication or interviews with your permission.",
      type: "text",
      validation_type: "address",
      required: true,
      autocomplete: "address-level2",
    },
    home_town: {
      label: "Home Town",
      placeholder: "Puttaparthi",
      help_text:
        "Tell us about your place of origin. This helps us learn more about your background and heritage.",
      type: "text",
      validation_type: "address",
      required: true,
    },
  },
  2: {
    relationship: {
      label: "Connection to Sai Baba",
      placeholder: "",
      help_text:
        "Select all that apply. This information helps us understand your background better. Use Ctrl on Windows or Command on Macs to select multiple options.",
      type: "select",
      select_options: [
        {
          value: "Office Bearer Sai Organization",
          label: "Office Bearer Sai Organization",
        },
        {
          value: "Employee of Sai Institutions",
          label: "Employee of Sai Institutions",
        },
        {
          value: "Student of Sai Baba Colleges",
          label: "Student of Sai Baba Colleges",
        },
        {
          value: "Author of Sai Baba Literature",
          label: "Author of Sai Baba Literature",
        },
        { value: "Child of Sai Devotees", label: "Child of Sai Devotees" },
        { value: "Sai Devotee", label: "Sai Devotee" },
      ],
      required: false,
      multiple: true,
    },
    skills: {
      label: "Specialist In",
      placeholder: "",
      help_text:
        "Select all that apply. We may reach out to you based on your expertise. Use Ctrl on Windows or Command on Macs to select multiple options.",
      type: "select",
      select_options: [
        { value: "Editing", label: "Editing" },
        { value: "Writing", label: "Writing" },
        { value: "Design/Graphics", label: "Design/Graphics" },
        { value: "Research", label: "Research" },
        {
          value: "Automation of Research Process",
          label: "Automation of Research Process",
        },
        { value: "Social Media Expert", label: "Social Media Expert" },
      ],
      required: false,
      multiple: true,
    },
  },
};

const customFieldsHelper = {
  multiple: "true/false",
  required: "true/false",
  placeholder: "Optional;",
  type: "text/select/checkbox",
  select_options: "Required if type is select; array of 'value' and 'label'",
  help_text: "Optional; for checkbox, this will be displayed on top of it",
  validation_type: "Optional; name/phone/address",
  autocomplete:
    "optional, not used if type is select; 'off' or anything from: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete",
};

var formFields = [];
let userGroup = null;
let customFields = null;

const escapeHtml = (value) => validator.escape(String(value ?? ""));
const sanitizeHelpText = (value) =>
  sanitizeHtml(String(value ?? ""), {
    allowedTags: ["a", "b", "br", "em", "i", "li", "ol", "p", "strong", "ul"],
    allowedAttributes: {
      a: ["href", "rel", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });

// validates only if validation_type is set OR if required
function validation(formData, interstitialIndex) {
  var error = "";
  for (var key in customFields[interstitialIndex]) {
    var value = formData[key];
    if (customFields[interstitialIndex][key].validation_type !== undefined) {
      if (customFields[interstitialIndex][key].validation_type == "name") {
        if (!/^([a-zA-Z ]){2,30}$/.test(value)) {
          error += `Invalid ${customFields[interstitialIndex][key].label}. `;
        }
      } else if (
        customFields[interstitialIndex][key].validation_type == "phone"
      ) {
        if (!/^\+([0-9]{1,3})([0-9]{6,14})$/.test(value)) {
          error += "Invalid phone number (Must start with a '+'). ";
        }
      } else if (
        customFields[interstitialIndex][key].validation_type == "address"
      ) {
        if (!/^[a-zA-Z]{4,49}(?:[\s-'][a-zA-Z]+)*$/.test(value)) {
          error += `Invalid ${customFields[interstitialIndex][key].label} (Include City, State). `;
        }
      }
    }
  }
  if (error == "") {
    return null;
  }
  return `Errors: ${error}`;
}

const user = require.main.require("./src/user");
const groups = require.main.require("./src/groups");

const plugin = {};

plugin.init = async ({ router }) => {

  // setup benchpress custom helper function
  Benchpress.registerHelper("isObject", function (val) {
    return typeof val === "object";
  });

  // Settings saved in the plugin settings can be retrieved via settings methods
  const settings = await meta.settings.get("limf");

  if (settings && settings.userGroup) {
    userGroup = settings.userGroup;
  } else {
    winston.error("[plugins/limf] New User group not set!");
  }

  if (settings && settings.customFields) {
    try {
      customFields = JSON.parse(settings.customFields);
    } catch (e) {
      winston.error(
        "[plugins/limf] customFields not valid JSON! Using defaultCustomFields."
      );
      customFields = defaultCustomFields;
      await meta.settings.set("limf", {
        customFields: JSON.stringify(defaultCustomFields, undefined, 4),
      });
    }
  } else {
    winston.error(
      "[plugins/limf] customFields not set! Using defaultCustomFields."
    );
    customFields = defaultCustomFields;
    await meta.settings.set("limf", {
      customFields: JSON.stringify(defaultCustomFields, undefined, 4),
    });
  }

  for (var interstitialIndex in customFields) {
    for (var key in customFields[interstitialIndex]) {
      const { label, placeholder, help_text, type, required, autocomplete } =
        customFields[interstitialIndex][key];
      const fieldName = escapeHtml(key);
      const fieldLabel = escapeHtml(label);
      const placeholderAttribute = placeholder
        ? ` placeholder="${escapeHtml(placeholder)}"`
        : "";
      const autocompleteAttribute = autocomplete
        ? ` autocomplete="${escapeHtml(autocomplete)}"`
        : "";
      const requiredAttribute = required ? " required" : "";
      const helpText = help_text
        ? `<div class="form-text">${sanitizeHelpText(help_text)}</div>`
        : "";
      if (!formFields[interstitialIndex]) {
        formFields[interstitialIndex] = "";
      }
      if (type == "text") {
        formFields[interstitialIndex] += `
      <label class="form-label" for="${fieldName}">${fieldLabel}</label>
      <input class="form-control" type="text" id="${fieldName}" name="${fieldName}"${placeholderAttribute}${autocompleteAttribute}${requiredAttribute} autocapitalize="off"
        />
        ${helpText}

    `;
      } else if (type == "checkbox") {
        formFields[interstitialIndex] += `
        <p>${fieldLabel}</p>
        ${helpText}
        <div class="form-check mb-3">
          <input class="form-check-input" type="checkbox" name="${fieldName}" id="${fieldName}"${requiredAttribute}>
          <label class="form-check-label" for="${fieldName}">${fieldLabel}</label>
        </div>
      `;
      } else if (type == "select") {
        const select_options =
          customFields[interstitialIndex][key].select_options;
        const multiple = customFields[interstitialIndex][key].multiple;
        var html = `<label class="form-label" for="${fieldName}">${fieldLabel}</label>
          <select class="form-control" name="${fieldName}" id="${fieldName}"${
          multiple ? " multiple" : ""
        }${requiredAttribute}>`;
        for (var option of select_options || []) {
          html += `<option value="${escapeHtml(option.value)}">${escapeHtml(
            option.label
          )}</option>`;
        }
        html += `</select>${helpText}`;
        formFields[interstitialIndex] += html;
      } else {
        winston.warn(`[plugins/limf] Unsupported field type: ${type}`);
      }
    }
  }
  routeHelpers.setupAdminPageRoute(
    router,
    "/admin/plugins/limf",
    (function (customFields, customFieldsHelper) {
      return function (req, res, next) {
        // Call the renderAdminPage function and pass the customFields
        controllers.renderAdminPage(
          req,
          res,
          next,
          customFields,
          customFieldsHelper
        );
      };
    })(customFields, customFieldsHelper)
  );
};

plugin.addAdminNavigation = (header) => {
  header.plugins.push({
    route: "/plugins/limf",
    icon: "fa-tint",
    name: "Love Is My Form",
  });

  return header;
};

plugin.whitelistFields = async ({ uids, whitelist }) => {
  for (var interstitialIndex in customFields) {
    for (var key in customFields[interstitialIndex]) {
      whitelist.push(key);
      whitelist.push("custom_data_collected");
    }
  }

  return { uids, whitelist };
};

plugin.customHeaders = function (headers, callback) {
  for (var interstitialIndex in customFields) {
    for (var key in customFields[interstitialIndex]) {
      var label = customFields[interstitialIndex][key].label;

      headers.headers.push({
        label: label,
      });
    }
  }

  callback(null, headers);
};

plugin.customFields = function (params, callback) {
  var users = params.users.map(function (user) {
    if (!user.customRows) {
      user.customRows = [];
      for (var interstitialIndex in customFields) {
        for (var key in customFields[interstitialIndex]) {
          user.customRows.push({ value: customFields[interstitialIndex][key] });
        }
      }
    }

    return user;
  });

  callback(null, { users: users });
};

plugin.registerInterstitial = async function (data) {
  if (!data.req.originalUrl.startsWith("/register/complete")) {
    return data;
  }

  if (!data.userData) {
    throw new Error("Invalid Data");
  }

  var customInterstitals = [];

  for (let interstitialIndex in customFields) {
    if (!data.userData[Object.keys(customFields[interstitialIndex])[0]]) {
      var customInterstital = {
        template: "partials/customRegistration",
        data: {
          fields: formFields[interstitialIndex],
        },
        callback: (userData, formData, next) => {
          var error = validation(formData, interstitialIndex);
          if (error == null) {
            for (var key in customFields[interstitialIndex]) {
              userData[key] = formData[key];
            }
            next(null);
          } else {
            next(new Error(error));
          }
        },
      };
      customInterstitals.unshift(customInterstital);
    }
  }

  for (var interstitial of customInterstitals) {
    data.interstitials.unshift(interstitial);
  }
  return data;
};

plugin.creatingUser = function (params, callback) {
  for (var interstitialIndex in customFields) {
    for (var key in customFields[interstitialIndex]) {
      params.user[key] = params.data[key];
    }
  }

  callback(null, params);
};

plugin.createdUser = async function (params) {
  try {
    var addCustomData = {};

    var index = 0;
    var keylist = [];
    for (var interstitialIndex in customFields) {
      for (var key in customFields[interstitialIndex]) {
        keylist.push(key);

        if (typeof params.data.customRows[index].value == "string") {
          addCustomData[key] = params.data.customRows[index].value;
        } else if (typeof params.data.customRows[index].value == "object") {
          addCustomData[key] = params.data.customRows[index].value.join(",");
        }
        index += 1;
      }
    }
    addCustomData["uid"] = params.user.uid;

    await user.updateProfile(1, addCustomData, keylist);

    if (userGroup != null) {
      await groups.join(userGroup, params.user.uid);
    }
  } catch (error) {
    winston.error("[plugins/limf] Unable to store registration data");
  }
};

plugin.addToApprovalQueue = function (params, callback) {
  var data = params.data;
  var userData = params.userData;

  data.customRows = [];

  for (var interstitialIndex in customFields) {
    for (var key in customFields[interstitialIndex]) {
      var fieldData = params.userData[key];
      data.customRows.push({ value: fieldData });
    }
  }

  callback(null, { data: data, userData: userData });
};

module.exports = plugin;
