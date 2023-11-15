"use strict";

const nconf = require.main.require("nconf");
const winston = require.main.require("winston");

const meta = require.main.require("./src/meta");

const controllers = require("./lib/controllers");

const routeHelpers = require.main.require("./src/routes/helpers");

const customFields = {
  test: {
    label: "Test Field",
    placeholder: "Test Field",
    help_text: "This is a test field.",
    type: "text",
    validation_type: "name",
    required: false,
  },
  fullname: {
    label: "Full Name",
    placeholder: "John Smith",
    help_text: "",
    type: "text",
    validation_type: "name",
    required: false,
    autocomplete: "name",
  },
  // email: {
  //   label: "Email Address",
  //   placeholder: "john.smith@gmail.com",
  //   help_text:
  //     "This forum uses your email address for account recovery in the event of a lost password, as well as for scheduled digest and notifications.",
  //   type: "text",
  //   validation_type: "email",
  //   required: true,
  //   autocomplete: "email",
  // },
  // phone: {
  //   label: "Phone Number",
  //   placeholder: "+919848249183",
  //   help_text:
  //     "Include the country code, +1 for US/Canada, +91 for India, etc.",
  //   type: "text",
  //   validation_type: "phone",
  //   required: true,
  //   autocomplete: "tel",
  // },
  // current_address: {
  //   label: "City of Current Residence",
  //   placeholder: "Bangalore",
  //   help_text:
  //     "Where do you live now? We will not share this information and only use it to connect with you, if needed.",
  //   type: "text",
  //   validation_type: "address",
  //   required: true,
  //   autocomplete: "address-level2",
  // },
  // home_town: {
  //   label: "Home Town",
  //   placeholder: "Puttaparthi",
  //   help_text:
  //     "Where are you from originally? This just tells us more about your roots.",
  //   type: "text",
  //   validation_type: "address",
  //   required: true,
  // },
  // relationship: {
  //   label: "Connection to Sai Baba",
  //   placeholder: "",
  //   help_text:
  //     "Select all that apply. We understand your background with this info. Hold down the Ctrl (Windows) or Command (Mac) button to select multiple options.",
  //   type: "multiselect",
  //   select_options: [
  //     {
  //       value: "Office Bearer Sai Organization",
  //       label: "Office Bearer Sai Organization",
  //     },
  //     {
  //       value: "Employee of Sai Institutions",
  //       label: "Employee of Sai Institutions",
  //     },
  //     {
  //       value: "Student of Sai Baba Colleges",
  //       label: "Student of Sai Baba Colleges",
  //     },
  //     {
  //       value: "Author of Sai Baba Literature",
  //       label: "Author of Sai Baba Literature",
  //     },
  //     { value: "Child of Sai Devotees", label: "Child of Sai Devotees" },
  //     { value: "Sai Devotee", label: "Sai Devotee" },
  //   ],
  //   required: false,
  // },
  // skills: {
  //   label: "Specialist In",
  //   placeholder: "",
  //   help_text:
  //     "Select all that apply. We may use your help based on your skills. Hold down the Ctrl (Windows) or Command (Mac) button to select multiple options.",
  //   type: "multiselect",
  //   select_options: [
  //     { value: "Editing", label: "Editing" },
  //     { value: "Writing", label: "Writing" },
  //     { value: "Design/Graphics", label: "Design/Graphics" },
  //     { value: "Research", label: "Research" },
  //     {
  //       value: "Automation of Research Process",
  //       label: "Automation of Research Process",
  //     },
  //     { value: "Social Media Expert", label: "Social Media Expert" },
  //   ],
  //   required: false,
  // },
};

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

plugin.registerInterstitial = function (params) {
  console.log("registerInterstitial");
  console.log("params.req.body:");
  console.log(params.req.body);
  console.log("params.userData:");
  console.log(params.userData);
  const url = params.req.originalUrl;
  console.log("url", url);

  var customInterstital = {
    template: "partials/customRegistration",
    data: {
      test: "test from customInterstital",
    },
    callback: async (userData, formData) => {
      console.log("customInterstital callback");
      console.log(userData);
      console.log(formData);
      userData.test = formData.test;
    },
  };
  params.interstitials.unshift(customInterstital);
  return params;
};

plugin.addFieldRegComplete = function (params, callback) {
  // console.log("addFieldRegComplete");
  // console.log(params.templateData.sections[0]);
  // var html = `<div><div class="mb-3"><label class="form-label" for="test">Test</label><input class="form-control" type="text" id="test" name="test" placeholder="{test}" value="{test}" /><p class="form-text">test</p></div></div>`;
  // params.templateData.sections.push(html);
  // console.log("end of addFieldRegComplete");
  callback(null, params);
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
