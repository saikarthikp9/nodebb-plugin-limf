"use strict";

const nconf = require.main.require("nconf");
const winston = require.main.require("winston");
const meta = require.main.require("./src/meta");
const controllers = require("./lib/controllers");
const routeHelpers = require.main.require("./src/routes/helpers");

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

var formFields = [];
let userGroup = null;
let customFields = null;

// validates only if validation_type is set OR if required
function validation(formData, interstitialIndex) {
  console.log(
    "################ Validation for interstitialIndex:",
    interstitialIndex
  );
  var error = "";
  for (var key in customFields[interstitialIndex]) {
    var value = formData[key];
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
  console.log("################ Validation errors:", error);
  if (error == "") {
    return null;
  }
  return `Errors: ${error}`;
}

const user = require.main.require("./src/user");
const groups = require.main.require("./src/groups");
const db = require.main.require("./src/database");

const plugin = {};

plugin.init = async (params) => {
  const { router /* , middleware , controllers */ } = params;

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

  console.log("#################### SETTINGS FIELDS ####################");
  for (var interstitialIndex in customFields) {
    for (var key in customFields[interstitialIndex]) {
      const { label, placeholder, help_text, type, required, autocomplete } =
        customFields[interstitialIndex][key];
      if (!formFields[interstitialIndex]) {
        formFields[interstitialIndex] = "";
      }
      if (type == "text") {
        formFields[interstitialIndex] += `
      <label class="form-label" for="${key}">${label}</label>
      <input class="form-control" type="${type}" id="${key}" name="${key}" placeholder="${placeholder}" autocomplete="${autocomplete}" ${
          required ? "required" : ""
        } />
      <p class="form-text">${help_text}</p>
    `;
      } else if (type == "select") {
        const select_options =
          customFields[interstitialIndex][key].select_options;
        const multiple = customFields[interstitialIndex][key].multiple;
        var html = `<label class="form-label" for="${key}">${label}</label>
          <select class="form-control" type="text" name="${key}" id="${key}" ${
          multiple ? "multiple" : ""
        }>`;
        for (var option of select_options) {
          html += `<option value="${option.value}">${option.label}</option>`;
        }
        html += `</select><p class="form-text">${help_text}</p>`;
        formFields[interstitialIndex] += html;
      } else {
        console.log("#################### ERROR ####################");
        console.log("Unsuppored type:", type);
      }
    }
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
    (function (customFields) {
      return function (req, res, next) {
        // Call the renderAdminPage function and pass the customFields
        controllers.renderAdminPage(req, res, next, customFields);
      };
    })(customFields)
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
  const url = data.req.originalUrl;
  console.log("############# url", url);

  if (!url.startsWith("/register/complete")) {
    console.log("############# return", "not register/complete");
    return data;
  }

  // if there is no user data (null case check)
  if (!data.userData) {
    console.log("############# error", "Invalid Data");
    throw new Error("Invalid Data");
  }

  var customInterstitals = [];
  // if the user already has this data saved, return early. userData contains the contents of req.session.
  // just checking if at least the first value is entered
  // TODO: replace with maker

  for (let interstitialIndex in customFields) {
    if (!data.userData[Object.keys(customFields[interstitialIndex])[0]]) {
      console.log("############# ", "not in userData");
      console.log(
        "Checked in data.userData for ",
        Object.keys(customFields[interstitialIndex])[0]
      );
      // add interstitial
      var customInterstital = {
        template: "partials/customRegistration",
        data: {
          fields: formFields[interstitialIndex],
        },
        // called when the form is submitted. userData is req.session, formData is the serialized form data in object format. Do value checks here and set the value in userData. It is checked at the top of this code block, remember?
        callback: (userData, formData, next) => {
          console.log(
            "############# callback for interstitialIndex",
            interstitialIndex
          );

          // TODO: VALIDATION
          var error = validation(formData, interstitialIndex);
          // var error = null;
          // throw an error if the user didn't submit the custom data. You can pass a language key here, or just plain text. The end user will have the page reloaded and your error will be shown.
          if (error == null) {
            // set all values from customFields from formData to userData
            console.log(
              "############# set userData for interstitialIndex ",
              interstitialIndex
            );
            for (var key in customFields[interstitialIndex]) {
              console.log("############# set userData for key ", key);
              userData[key] = formData[key];
              console.log("userData[key]", userData[key]);
            }
            console.log("############# userData set and then next(null)");
            next(null);
          } else {
            console.log("############# error and then next(error)");
            console.log(error);
            next(new Error(error));
          }
        },
      };
      customInterstitals.unshift(customInterstital);
    }
  }

  // I think this check is not required
  // if data.userData.uid is present it means this is an EXISTING user, not a new user. Check their hash to see whether they submitted the data.
  // if (data.userData.uid) {
  //   const customData = await db.getObjectField(
  //     `user:${data.userData.uid}`,
  //     "test"
  //   );
  //   if (customData) {
  //     console.log("############# return", "already in DB");
  //     return data;
  //   }
  // }

  // add interstitial to data
  for (var interstitial of customInterstitals) {
    data.interstitials.unshift(interstitial);
  }
  console.log("############# last return");
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
    console.log("plugin.createdUser.params");
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
    console.log(error);
  }
};

plugin.addToApprovalQueue = function (params, callback) {
  console.log("addToApprovalQueue");

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
