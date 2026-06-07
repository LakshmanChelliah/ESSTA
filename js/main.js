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

      const isValid = Object.keys(fields).every(validateField);
      if (!isValid) {
        const firstInvalid = membershipForm.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      membershipForm.hidden = true;
      if (formSuccess) {
        formSuccess.hidden = false;
        formSuccess.focus();
      }
    });

    membershipForm.addEventListener('reset', function () {
      Object.keys(fields).forEach(function (key) {
        setFieldError(fields[key], '');
      });
    });

    if (submitAnotherBtn && formSuccess) {
      submitAnotherBtn.addEventListener('click', function () {
        membershipForm.reset();
        Object.keys(fields).forEach(function (key) {
          setFieldError(fields[key], '');
        });
        formSuccess.hidden = true;
        membershipForm.hidden = false;
        document.getElementById('full-name').focus();
      });
    }
  }
})();
