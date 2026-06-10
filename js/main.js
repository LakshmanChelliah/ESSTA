(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  const navLinks = document.querySelectorAll('.site-nav a');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
      siteNav.classList.toggle('is-open', !isOpen);
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        siteNav.classList.remove('is-open');
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.site-nav a');

  if (sections.length && navItems.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navItems.forEach(function (item) {
              const isActive = item.getAttribute('href') === '#' + id;
              item.classList.toggle('is-active', isActive);
              if (isActive) {
                item.setAttribute('aria-current', 'page');
              } else {
                item.removeAttribute('aria-current');
              }
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  const membershipForm = document.getElementById('membership-form');
  const formSuccess = document.getElementById('form-success');
  const submitAnotherBtn = document.getElementById('submit-another');
  const formSubmitError = document.getElementById('form-submit-error');
  const submitButton = document.getElementById('membership-submit');
  const formHoney = document.getElementById('form-honey');

  let membershipFormConfigPromise = null;

  function loadMembershipFormConfig() {
    if (!membershipFormConfigPromise) {
      membershipFormConfigPromise = fetch('essta-info.json')
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Could not load form configuration.');
          }
          return response.json();
        })
        .then(function (data) {
          const contact = data.organization && data.organization.contact;
          const formSettings = data.organization && data.organization.membership_form;

          if (!contact || !contact.inquiries_email) {
            throw new Error('Form recipient email is not configured.');
          }

          const ccEmails = Array.isArray(contact.other_emails)
            ? contact.other_emails.filter(Boolean)
            : [];

          return {
            primaryEmail: contact.inquiries_email,
            ccEmails: ccEmails,
            subject: (formSettings && formSettings.subject) || 'New ESSTA Membership Application',
            template: (formSettings && formSettings.template) || 'table'
          };
        })
        .catch(function (err) {
          membershipFormConfigPromise = null;
          throw err;
        });
    }

    return membershipFormConfigPromise;
  }

  function showFormSubmitError(message) {
    if (!formSubmitError) return;
    formSubmitError.textContent = message;
    formSubmitError.hidden = false;
  }

  function hideFormSubmitError() {
    if (!formSubmitError) return;
    formSubmitError.textContent = '';
    formSubmitError.hidden = true;
  }

  function setSubmitting(isSubmitting) {
    if (submitButton) {
      submitButton.disabled = isSubmitting;
      submitButton.textContent = isSubmitting ? 'Sending…' : 'Submit Application';
    }
    if (membershipForm) {
      membershipForm.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    }
  }

  function formatInterestedTopics() {
    const topicLabels = {
      volunteering: 'Volunteering',
      walking: 'Walking'
    };
    const selected = [];

    membershipForm.querySelectorAll('input[name="interestedTopics"]:checked').forEach(function (input) {
      if (input.value === 'other') {
        const otherText = document.getElementById('interested-topic-other');
        const detail = otherText && otherText.value.trim();
        selected.push(detail ? 'Other: ' + detail : 'Other');
        return;
      }

      selected.push(topicLabels[input.value] || input.value);
    });

    return selected.length ? selected.join(', ') : 'None selected';
  }

  function buildSubmissionFormData(config) {
    const payload = new FormData();

    payload.append('_subject', config.subject);
    payload.append('_template', config.template);
    payload.append('_captcha', 'false');

    if (config.ccEmails.length) {
      payload.append('_cc', config.ccEmails.join(','));
    }

    payload.append('Full Name', document.getElementById('full-name').value.trim());

    const dateOfBirth = document.getElementById('date-of-birth').value;
    if (dateOfBirth) {
      payload.append('Date of Birth', dateOfBirth);
    }

    payload.append('Home Address', document.getElementById('address').value.trim());
    payload.append('Phone Number', document.getElementById('telephone').value.trim());
    const applicantEmail = document.getElementById('email').value.trim();
    payload.append('Email Address', applicantEmail);
    payload.append('_replyto', applicantEmail);
    payload.append('Emergency Contact Name', document.getElementById('emergency-contact-name').value.trim());
    payload.append('Emergency Contact Phone', document.getElementById('emergency-contact-phone').value.trim());
    payload.append('Interested Topics', formatInterestedTopics());

    const memberIntro = document.getElementById('member-intro').value.trim();
    if (memberIntro) {
      payload.append('About You', memberIntro);
    }

    payload.append('Membership Age Confirm', document.getElementById('membership-confirm').checked ? 'Yes' : 'No');

    if (formHoney) {
      payload.append('_honey', formHoney.value);
    }

    return payload;
  }

  function submitMembershipApplication(config) {
    const endpoint = 'https://formsubmit.co/ajax/' + encodeURIComponent(config.primaryEmail);

    return fetch(endpoint, {
      method: 'POST',
      body: buildSubmissionFormData(config),
      headers: {
        Accept: 'application/json'
      }
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.success) {
          throw new Error('Submission failed.');
        }
        return data;
      });
    });
  }

  if (membershipForm) {
    const fields = {
      fullName: {
        input: document.getElementById('full-name'),
        error: document.getElementById('full-name-error'),
        validate: function (value) {
          if (!value.trim()) return 'Please enter your full name.';
          return '';
        }
      },
      address: {
        input: document.getElementById('address'),
        error: document.getElementById('address-error'),
        validate: function (value) {
          if (!value.trim()) return 'Please enter your address.';
          return '';
        }
      },
      telephone: {
        input: document.getElementById('telephone'),
        error: document.getElementById('telephone-error'),
        validate: function (value) {
          if (!value.trim()) return 'Please enter your telephone number.';
          if (!/^[\d\s\-().+]{7,}$/.test(value.trim())) {
            return 'Please enter a valid telephone number.';
          }
          return '';
        }
      },
      email: {
        input: document.getElementById('email'),
        error: document.getElementById('email-error'),
        validate: function (value) {
          if (!value.trim()) return 'Please enter your email address.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
            return 'Please enter a valid email address.';
          }
          return '';
        }
      },
      emergencyContactName: {
        input: document.getElementById('emergency-contact-name'),
        error: document.getElementById('emergency-contact-name-error'),
        validate: function (value) {
          if (!value.trim()) return 'Please enter your emergency contact name.';
          return '';
        }
      },
      emergencyContactPhone: {
        input: document.getElementById('emergency-contact-phone'),
        error: document.getElementById('emergency-contact-phone-error'),
        validate: function (value) {
          if (!value.trim()) return 'Please enter your emergency contact phone number.';
          if (!/^[\d\s\-().+]{7,}$/.test(value.trim())) {
            return 'Please enter a valid phone number.';
          }
          return '';
        }
      },
      membershipConfirm: {
        input: document.getElementById('membership-confirm'),
        error: document.getElementById('membership-confirm-error'),
        isCheckbox: true,
        validate: function (value, input) {
          if (!input.checked) {
            return 'You must confirm your wish to join and that you have reached 60 years of age.';
          }
          return '';
        }
      }
    };

    function setFieldError(field, message) {
      field.input.classList.toggle('is-invalid', Boolean(message));
      field.input.setAttribute('aria-invalid', message ? 'true' : 'false');
      field.error.textContent = message;
      if (field.isCheckbox) {
        const group = document.getElementById('membership-confirm-group');
        if (group) group.classList.toggle('is-invalid', Boolean(message));
      }
    }

    function validateField(key) {
      const field = fields[key];
      const message = field.isCheckbox
        ? field.validate('', field.input)
        : field.validate(field.input.value);
      setFieldError(field, message);
      return !message;
    }

    Object.keys(fields).forEach(function (key) {
      const field = fields[key];
      const eventName = field.isCheckbox ? 'change' : 'blur';

      field.input.addEventListener(eventName, function () {
        validateField(key);
      });

      if (!field.isCheckbox) {
        field.input.addEventListener('input', function () {
          if (field.input.classList.contains('is-invalid')) {
            validateField(key);
          }
        });
      }
    });

    membershipForm.addEventListener('submit', function (event) {
      event.preventDefault();
      hideFormSubmitError();

      const isValid = Object.keys(fields).every(validateField);
      if (!isValid) {
        const firstInvalid = membershipForm.querySelector('.is-invalid, .checkbox-group.is-invalid input');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (formHoney && formHoney.value.trim()) {
        return;
      }

      setSubmitting(true);

      loadMembershipFormConfig()
        .then(submitMembershipApplication)
        .then(function () {
          membershipForm.hidden = true;
          if (formSuccess) {
            formSuccess.hidden = false;
            formSuccess.focus();
          }
        })
        .catch(function () {
          showFormSubmitError(
            'We could not send your application right now. Please try again in a few minutes, or email info@essta.ca directly.'
          );
        })
        .finally(function () {
          setSubmitting(false);
        });
    });

    membershipForm.addEventListener('reset', function () {
      Object.keys(fields).forEach(function (key) {
        setFieldError(fields[key], '');
      });
      resetOtherTopicInput();
    });

    const otherTopicCheck = document.getElementById('interested-topic-other-check');
    const otherTopicInput = document.getElementById('interested-topic-other');

    function resetOtherTopicInput() {
      if (otherTopicInput) {
        otherTopicInput.disabled = true;
        otherTopicInput.value = '';
      }
    }

    if (otherTopicCheck && otherTopicInput) {
      otherTopicCheck.addEventListener('change', function () {
        otherTopicInput.disabled = !otherTopicCheck.checked;
        if (otherTopicCheck.checked) {
          otherTopicInput.focus();
        } else {
          otherTopicInput.value = '';
        }
      });
    }

    if (submitAnotherBtn && formSuccess) {
      submitAnotherBtn.addEventListener('click', function () {
        membershipForm.reset();
        Object.keys(fields).forEach(function (key) {
          setFieldError(fields[key], '');
        });
        resetOtherTopicInput();
        hideFormSubmitError();
        setSubmitting(false);
        formSuccess.hidden = true;
        membershipForm.hidden = false;
        document.getElementById('full-name').focus();
      });
    }
  }
})();
