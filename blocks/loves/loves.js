function createSelect(fd) {
  const select = document.createElement('select');
  select.id = fd.Field;
  if (fd.Placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fd.Placeholder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    select.append(ph);
  }
  fd.Options.split(',').forEach((o) => {
    const option = document.createElement('option');
    const currentUrl = window.location.href;
    option.textContent = o.trim();
    if (o.trim() === 'url') {
      option.value = currentUrl.trim();
    } else {
      option.value = o.trim();
    }
    select.append(option);
  });
  if (fd.Mandatory === 'x') {
    select.setAttribute('required', 'required');
  }
  return select;
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });
  await resp.text();
  return payload;
}

function createButton(fd) {
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.classList.add('button');
  if (fd.Type === 'submit') {
    button.addEventListener('click', async (event) => {
      const form = button.closest('form');
      if (form.checkValidity()) {
        event.preventDefault();
        button.setAttribute('disabled', '');
        await submitForm(form);
        // update the div lovesdiv to have the text of loves plus 1
        const lovesdiv = document.getElementById('loves');
        lovesdiv.textContent = parseInt(lovesdiv.textContent, 10) + 1;
        const redirectTo = fd.Extra;
        // If redirectTo is not blank
        if (redirectTo) {
          // If redirectTo is a valid URL
          if (redirectTo.match(/^(http|https):\/\//)) {
            window.location.href = redirectTo;
          } else {
            button.textContent = redirectTo;
          }
        }
      }
    });
  }
  return button;
}

function createHeading(fd) {
  const heading = document.createElement('h3');
  heading.textContent = fd.Label;
  return heading;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  if (fd.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createTextArea(fd) {
  const input = document.createElement('textarea');
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  if (fd.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createLabel(fd) {
  const label = document.createElement('label');
  label.setAttribute('for', fd.Field);
  label.textContent = fd.Label;
  if (fd.Mandatory === 'x') {
    label.classList.add('required');
  }
  return label;
}

function applyRules(form, rules) {
  const payload = constructPayload(form);
  rules.forEach((field) => {
    const { type, condition: { key, operator, value } } = field.rule;
    if (type === 'visible') {
      if (operator === 'eq') {
        if (payload[key] === value) {
          form.querySelector(`.${field.fieldId}`).classList.remove('hidden');
        } else {
          form.querySelector(`.${field.fieldId}`).classList.add('hidden');
        }
      }
    }
  });
}

async function createForm(formURL, lovesURL) {
  const { pathname } = new URL(formURL);
  // Write the pathname to the console
  console.log(pathname);
  const resp = await fetch(pathname);
  // Write resp to the console
  console.log(resp);
  const json = await resp.json();
  // Write json to the console
  console.log(json);
  const form = document.createElement('form');
  const rules = [];
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  // Write form.dataset.action to the console
  console.log(form.dataset.action);
  const lovespathname = new URL(lovesURL);
  // Write the lovespathname to the console
  console.log(lovespathname.pathname);
  // console.log(lovesURL);
  const lovesresp = await fetch(lovespathname.pathname);
  // Write lovesresp to the console
  console.log(lovesresp);
  // Get the json from the lovesresp
  const lovesjson = await lovesresp.json();
  // Write lovesjson to the console
  console.log(lovesjson);
  // set the variable siteurl to the current URL
  const siteurl = window.location.href;
  // Write siteurl to the console
  console.log(siteurl);
  // set the variable loveline by parsing the json lovejson
  // for the key "site" with a value of siteurl
  const loveline = lovesjson.data.find((love) => love.site === siteurl);
  // Write loveline to the console
  console.log(loveline);
  // set the variable lovesCount to the value of the key "loves" in the loveline variable
  // const loves = loveline.loves;
  const { loves: lovesCount } = loveline;
  // Write loves to the console
  console.log(lovesCount);
  // create a text div with the id "loves" and the text content of the loves variable
  const lovesdiv = document.createElement('div');
  lovesdiv.id = 'loves';
  lovesdiv.textContent = lovesCount;
  json.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fd.Style ? ` form-${fd.Style}` : '';
    const fieldId = `form-${fd.Field}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    switch (fd.Type) {
      case 'select':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createSelect(fd));
        break;
      case 'heading':
        fieldWrapper.append(createHeading(fd));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'text-area':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createTextArea(fd));
        break;
      case 'submit':
        fieldWrapper.append(lovesdiv);
        fieldWrapper.append(createButton(fd));
        break;
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
    }

    if (fd.Rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fd.Rules) });
      } catch (e) {
        console.log(`Invalid Rule ${fd.Rules}: ${e}`);
      }
    }
    form.append(fieldWrapper);
  });

  form.addEventListener('change', () => applyRules(form, rules));
  applyRules(form, rules);

  return (form);
}

export default async function decorate(block) {
  const form = block.querySelector('a[href$=".json"]');
  // Write form to the console
  console.log(form.href);
  const loves = block.querySelectorAll('a[href$=".json"]')[1];
  // write loves to the console
  console.log(loves.href);
  if (form && loves) {
    form.replaceWith(await createForm(form.href, loves.href));
    loves.remove();
  }
}
