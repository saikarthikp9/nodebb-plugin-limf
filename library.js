"use strict";

const nconf = require.main.require("nconf");
const winston = require.main.require("winston");

const meta = require.main.require("./src/meta");

const controllers = require("./lib/controllers");

const routeHelpers = require.main.require("./src/routes/helpers");

const customFields = {
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
};

var fields = "";

console.log("#################### SETTINGS FIELDS ####################");
for (var key in customFields) {
  const label = customFields[key].label;
  const placeholder = customFields[key].placeholder;
  const help_text = customFields[key].help_text;
  const type = customFields[key].type;
  const required = customFields[key].required;
  const autocomplete = customFields[key].autocomplete;

  if (type == "text") {
    fields += `
      <label class="form-label" for="${key}">${label}</label>
      <input class="form-control" type="${type}" id="${key}" name="${key}" placeholder="${placeholder}" autocomplete="${autocomplete}" ${
      required ? "required" : ""
    } />
      <p class="form-text">${help_text}</p>
    `;
  } else if (type == "select") {
    const select_options = customFields[key].select_options;
    const multiple = customFields[key].multiple;
    var html = `<label class="form-label" for="${key}">${label}</label>
    <select class="form-control" type="text" name="${key}" id="${key}" ${
      multiple ? "multiple" : ""
    }>`;
    for (var option of select_options) {
      html += `<option value="${option.value}">${option.label}</option>`;
    }
    html += `<p class="form-text">${help_text}</p>`;
    fields += html;
  }
}

// validates only if validation_type is set OR if required
function validation(formData) {
  console.log("################ Validation");
  var error = "";
  for (var key in customFields) {
    var value = formData[key];
    if (customFields[key].validation_type == "name") {
      if (!/^([a-zA-Z ]){2,30}$/.test(value)) {
        error += `Invalid ${customFields[key].label}. `;
      }
    } else if (customFields[key].validation_type == "phone") {
      if (!/^\+([0-9]{1,3})([0-9]{6,14})$/.test(value)) {
        error += "Invalid phone number (Must start with a '+'). ";
      }
    } else if (customFields[key].validation_type == "address") {
      if (!/^[a-zA-Z]+(?:[\s-'][a-zA-Z]+){1,48}$/.test(value)) {
        error += `Invalid ${customFields[key].label}. `;
      }
    }
  }
  if (error == "") {
    return null;
  }
  return `Errors: ${error}`;
}

// if (customFields[key].type == "text") {
//   var html = `<input class="form-control" type="text" name="${key}" id="${key}" placeholder="${customFields[key].placeholder}" autocomplete="${customFields[key].autocomplete}"><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
// } else if (customFields[key].type == "textarea") {
//   var html = `<textarea class="form-control" type="text" name="${key}" id="${key}" placeholder="${customFields[key].placeholder}" autocomplete="${customFields[key].autocomplete}"></textarea><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
// } else if (customFields[key].type == "select") {
//   var html = `<select class="form-control" type="text" name="${key}" id="${key}">`;
//   for (var option of customFields[key].select_options) {
//     html += `<option value="${option.value}">${option.label}</option>`;
//   }
//   html += `</select><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
// } else if (customFields[key].type == "checkbox") {
//   var html = `<input class="form-control" type="checkbox" name="${key}" id="${key}"><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
// } else if (customFields[key].type == "multiselect") {
//   var html = `<select class="form-control" type="text" name="${key}" id="${key}" multiple>`;
//   for (var option of customFields[key].select_options) {
//     html += `<option value="${option.value}">${option.label}</option>`;
//   }
//   html += `</select><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
// }

const user = require.main.require("./src/user");
const db = require.main.require("./src/database");

const plugin = {};

plugin.init = async (params) => {
  const { router /* , middleware , controllers */ } = params;

  // Settings saved in the plugin settings can be retrieved via settings methods
  const { setting1, setting2 } = await meta.settings.get("limf");
  if (setting1) {
    console.log(setting2);
  }

  /**
   * We create two routes for every view. One API call, and the actual route itself.
   * Use the `setupPageRoute` helper and NodeBB will take care of everything for you.
   *
   * Other helpers include `setupAdminPageRoute` and `setupAPIRoute`
   * */
  routeHelpers.setupPageRoute(
    router,
    "/limf",
    [
      (req, res, next) => {
        winston.info(
          `[plugins/limf] In middleware. This argument can be either a single middleware or an array of middlewares`
        );
        setImmediate(next);
      },
    ],
    (req, res) => {
      winston.info(
        `[plugins/limf] Navigated to ${nconf.get("relative_path")}/limf`
      );
      res.render("limf", { uid: req.uid });
    }
  );

  routeHelpers.setupAdminPageRoute(
    router,
    "/admin/plugins/limf",
    controllers.renderAdminPage
  );
};

/**
 * If you wish to add routes to NodeBB's RESTful API, listen to the `static:api.routes` hook.
 * Define your routes similarly to above, and allow core to handle the response via the
 * built-in helpers.formatApiResponse() method.
 *
 * In this example route, the `ensureLoggedIn` middleware is added, which means a valid login
 * session or bearer token (which you can create via ACP > Settings > API Access) needs to be
 * passed in.
 *
 * To call this example route:
 *   curl -X GET \
 * 		http://example.org/api/v3/plugins/limf/test \
 * 		-H "Authorization: Bearer some_valid_bearer_token"
 *
 * Will yield the following response JSON:
 * 	{
 *		"status": {
 *			"code": "ok",
 *			"message": "OK"
 *		},
 *		"response": {
 *			"foobar": "test"
 *		}
 *	}
 */
plugin.addRoutes = async ({ router, middleware, helpers }) => {
  const middlewares = [
    middleware.ensureLoggedIn, // use this if you want only registered users to call this route
    // middleware.admin.checkPrivileges,	// use this to restrict the route to administrators
  ];

  routeHelpers.setupApiRoute(
    router,
    "get",
    "/limf/:param1",
    middlewares,
    (req, res) => {
      helpers.formatApiResponse(200, res, {
        foobar: req.params.param1,
      });
    }
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
  for (var key in customFields) {
    whitelist.push(key);
    whitelist.push("custom_data_collected");
  }

  return { uids, whitelist };
};

plugin.customHeaders = function (headers, callback) {
  for (var key in customFields) {
    var label = customFields[key].label;

    headers.headers.push({
      label: label,
    });
  }

  callback(null, headers);
};

plugin.customFields = function (params, callback) {
  var users = params.users.map(function (user) {
    if (!user.customRows) {
      user.customRows = [];
      for (var key in customFields) {
        user.customRows.push({ value: customFields[key] });
      }
    }

    return user;
  });

  callback(null, { users: users });
};

plugin.registerInterstitial = async function (data) {
  const url = data.req.originalUrl;
  console.log("############# url", url);

  if (!url.startsWith("/register/complete")) {
    console.log("############# return", "not register/complete");
    return data;
  }

  // if the user already has this data saved, return early. userData contains the contents of req.session.
  // just checking if at least the first value is entered
  if (data.userData && data.userData.custom_data_collected) {
    console.log(
      "############# return",
      "already in userData custom_data_collected"
    );
    return data;
  }

  // if there is no user data (null case check)
  if (!data.userData) {
    console.log("############# error", "Invalid Data");
    throw new Error("Invalid Data");
  }

  // if data.userData.uid is present it means this is an EXISTING user, not a new user. Check their hash to see whether they submitted the data.
  if (data.userData.uid) {
    const customData = await db.getObjectField(
      `user:${data.userData.uid}`,
      "test"
    );
    if (customData) {
      console.log("############# return", "already in DB");
      return data;
    }
  }

  var customInterstital = {
    template: "partials/customRegistration",
    data: {
      fields: fields,
    },
    // called when the form is submitted. userData is req.session, formData is the serialized form data in object format. Do value checks here and set the value in userData. It is checked at the top of this code block, remember?
    callback: (userData, formData, next) => {
      console.log("############# callback");

      // TODO: VALIDATION
      var error = validation(formData);
      // var error = null;
      // throw an error if the user didn't submit the custom data. You can pass a language key here, or just plain text. The end user will have the page reloaded and your error will be shown.
      if (error == null) {
        // set all values from customFields from formData to userData
        for (var key in customFields) {
          console.log(
            `############# setting ${key} from formData ${formData[key]}`
          );

          userData[key] = formData[key];
          console.log(userData[key]);
        }
        userData["custom_data_collected"] = true;
        console.log("############# userData set and then next(null)");
        console.log("formData", formData);
        console.log("userData", userData);
        next(null);
      } else {
        console.log("############# error and then next(error)");
        console.log(error);
        next(new Error(error));
      }
    },
  };
  data.interstitials.unshift(customInterstital);
  console.log("############# last return");
  return data;
};

plugin.addField = function (params, callback) {
  for (var key in customFields) {
    if (key == "") {
      callback(null, params);
      return;
    }

    var label = customFields[key].label;
    if (customFields[key].type == "text") {
      var html = `<input class="form-control" type="text" name="${key}" id="${key}" placeholder="${customFields[key].placeholder}" autocomplete="${customFields[key].autocomplete}"><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
    } else if (customFields[key].type == "textarea") {
      var html = `<textarea class="form-control" type="text" name="${key}" id="${key}" placeholder="${customFields[key].placeholder}" autocomplete="${customFields[key].autocomplete}"></textarea><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
    } else if (customFields[key].type == "select") {
      var html = `<select class="form-control" type="text" name="${key}" id="${key}">`;
      for (var option of customFields[key].select_options) {
        html += `<option value="${option.value}">${option.label}</option>`;
      }
      html += `</select><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
    } else if (customFields[key].type == "checkbox") {
      var html = `<input class="form-control" type="checkbox" name="${key}" id="${key}"><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
    } else if (customFields[key].type == "multiselect") {
      var html = `<select class="form-control" type="text" name="${key}" id="${key}" multiple>`;
      for (var option of customFields[key].select_options) {
        html += `<option value="${option.value}">${option.label}</option>`;
      }
      html += `</select><span class="custom-feedback" id="${key}-notify"></span><span class="help-block text-xs">${customFields[key].help_text}</span>`;
    }

    var captcha = {
      label: label,
      html: html,
    };

    if (
      params.templateData.regFormEntry &&
      Array.isArray(params.templateData.regFormEntry)
    ) {
      params.templateData.regFormEntry.push(captcha);
    } else {
      params.templateData.captcha = captcha;
    }
  }
  callback(null, params);
};

plugin.checkField = function (params, callback) {
  var userData = params.userData;
  var error = null;
  for (var key in customFields) {
    var value = userData[key];
    if (customFields[key].validation_type == "phone") {
      if (value.length < 10 || !/^\+\d{8,}$/.test(value)) {
        error = {
          message:
            "Invalid phone number. It must start with a '+' and be 10 digits or more.",
        };
      }
    } else if (customFields[key].validation_type == "address") {
      if (value.length < 3) {
        error = { message: "Enter a valid address." };
      } else if (/[!@$%^&*(),?":{}|<>]/.test(value)) {
        error = {
          message: "Invalid address. It must not contain special characters.",
        };
      }
    } else if (customFields[key].validation_type == "email") {
      if (!/^(?![A-Z])[\w\.\-\+]+@[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}$/.test(value)) {
        error = { message: "Invalid email address." };
      }
    } else if (customFields[key].required) {
      if (value == "" || value == undefined) {
        error = {
          message: "Please complete all required fields before submitting.",
        };
      }
    }
  }
  callback(error, params);
};

plugin.creatingUser = function (params, callback) {
  for (var key in customFields) {
    params.user[key] = params.data[key];
  }

  callback(null, params);
};

plugin.createdUser = async function (params) {
  try {
    console.log("plugin.createdUser.params");
    console.log("params", params);
    var addCustomData = {};

    let index = 0;
    var keylist = [];
    for (let key in customFields) {
      keylist.push(key);
      console.log(key);
      console.log(index);
      console.log(params.data.customRows[index]);
      console.log(params.data.customRows[index].value);
      console.log(typeof params.data.customRows[index].value);

      if (typeof params.data.customRows[index].value == "string") {
        addCustomData[key] = params.data.customRows[index].value;
      } else if (typeof params.data.customRows[index].value == "object") {
        addCustomData[key] = params.data.customRows[index].value.join(",");
      }
      index += 1;
    }
    addCustomData["uid"] = params.user.uid;
    console.log("addCustomData", addCustomData);

    var keyID = "`user:`" + params.user.uid + ":ns:custom_fields";

    console.log("keyID", keyID);

    await user.updateProfile(
      // callerUid,
      1,
      addCustomData,
      keylist
    );
  } catch (error) {
    console.log(error);
  }
};

plugin.addToApprovalQueue = function (params, callback) {
  console.log("addToApprovalQueue");
  console.log(params.data);
  console.log(params.userData);
  var data = params.data;
  var userData = params.userData;

  data.customRows = [];

  for (var key in customFields) {
    var fieldData = params.userData[key];
    console.log(fieldData);
    console.log(typeof fieldData);
    data.customRows.push({ value: fieldData });
  }

  console.log(data.customRows);
  callback(null, { data: data, userData: userData });
};

module.exports = plugin;
