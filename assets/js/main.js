/* ==========================================================
   OJT Portfolio – main.js
   Site navigation (mobile menu + active section) and
   inquiry form behavior
   ========================================================== */
(function () {
  'use strict';

  /* ---------- Site navigation ---------- */
  var pill = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[data-target]'));

  function setMenu(open) {
    if (!pill || !toggle) return;
    pill.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  if (pill && toggle) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    pill.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (!pill.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // Highlight the link for the section currently in view
  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute('data-target') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    links.forEach(function (a) {
      var section = document.getElementById(a.getAttribute('data-target'));
      if (section) observer.observe(section);
    });
  }
  setActive('');

  /* ---------- Inquiry form ---------- */
  var form = document.getElementById('inquiry-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');
  var endpoint = form.getAttribute('data-endpoint');
  var sending = false;

  var rules = {
    name: function (v) { return v.trim() ? '' : 'Please enter your name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    subject: function (v) { return v.trim() ? '' : 'Please enter a subject.'; },
    message: function (v) { return v.trim() ? '' : 'Please enter your message or concern.'; }
  };

  function validateField(name) {
    var input = form.elements[name];
    var msg = rules[name](input.value);
    var wrapper = input.closest('.field');
    var err = document.getElementById(name + '-error');
    err.textContent = msg;
    wrapper.classList.toggle('invalid', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    form.elements[name].addEventListener('blur', function () { validateField(name); });
    form.elements[name].addEventListener('input', function () {
      if (form.elements[name].closest('.field').classList.contains('invalid')) validateField(name);
    });
  });

  function setStatus(text, type) {
    status.textContent = text;
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) {
      firstInvalid.focus();
      setStatus('Please fix the highlighted fields.', 'failure');
      return;
    }

    if (!endpoint || endpoint.indexOf('YOUR_FORM_ID') !== -1) {
      setStatus('The form is not connected yet. Please use the email link above instead.', 'failure');
      return;
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('', '');

    fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        form.reset();
        setStatus('Thank you! Your inquiry was sent successfully.', 'success');
      })
      .catch(function () {
        // Typed values are kept so the sender can retry.
        setStatus('Sorry, your message could not be sent. Please try again or use the email link.', 'failure');
      })
      .finally(function () {
        sending = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';
      });
  });
})();
