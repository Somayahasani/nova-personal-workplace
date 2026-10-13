
const SUPABASE_URL = "sb_publishable_L7yPP_Mq_QiZwT8GHFtOpg_Rpqq-i4j";
const SUPABASE_PUBLISHABLE_KEY = "sb_secret_M7RpVgRz1TnJIMyMavd2oA_KCrZcGwf";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
    #novaAuth {
      position: fixed; inset: 0; z-index: 9999;
      display: grid; place-items: center; padding: 20px;
      background: #090b12; color: #e9eaf5;
      font: 14px/1.5 system-ui, sans-serif;
    }
    #novaAuth .auth-card {
      width: min(100%, 390px); padding: 26px;
      background: #121522; border: 1px solid #292d42;
      border-radius: 16px;
    }
    #novaAuth h2 { margin: 0 0 6px; font-size: 25px; }
    #novaAuth p { color: #9298b5; }
    #novaAuth input, #novaAuth button {
      width: 100%; padding: 12px; margin-top: 12px;
      border-radius: 8px; font: inherit;
    }
    #novaAuth input {
      color: white; background: #0b0e17;
      border: 1px solid #30334a;
    }
    #novaAuth button {
      cursor: pointer; border: 1px solid #827aff;
      background: #7770ed; color: white;
    }
    #novaAuth button.secondary {
      background: transparent; border-color: #30334a;
    }
    #novaAuth button:disabled { opacity: .6; cursor: wait; }
    #novaAuthMsg { min-height: 24px; overflow-wrap: anywhere; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.id = "novaAuth";
  panel.innerHTML = `
    <div class="auth-card">
      <h2>✦ nova</h2>
      <p>Your mind. Your journey.</p>
      <form id="novaAuthForm">
        <input id="novaEmail" type="email"
          placeholder="Email address" autocomplete="email" required>
        <input id="novaPassword" type="password"
          placeholder="Password (at least 6 characters)"
          autocomplete="current-password" minlength="6" required>
        <button id="novaSignIn" type="submit">Sign in</button>
        <button id="novaSignUp" class="secondary" type="button">
          Create an account
        </button>
        <button id="novaReset" class="secondary" type="button">
          Forgot password?
        </button>
      </form>
      <p id="novaAuthMsg" role="status" aria-live="polite"></p>
    </div>
  `;
  document.body.appendChild(panel);

  const form = document.getElementById("novaAuthForm");
  const email = document.getElementById("novaEmail");
  const password = document.getElementById("novaPassword");
  const message = document.getElementById("novaAuthMsg");
  const signInButton = document.getElementById("novaSignIn");
  const signUpButton = document.getElementById("novaSignUp");
  const resetButton = document.getElementById("novaReset");

  let busy = false;

  function showMessage(text) {
    message.textContent = text;
  }

  async function runAuth(action) {
    if (busy) return;
    busy = true;
    signInButton.disabled = true;
    signUpButton.disabled = true;
    resetButton.disabled = true;

    try {
      await action();
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    } finally {
      busy = false;
      signInButton.disabled = false;
      signUpButton.disabled = false;
      resetButton.disabled = false;
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    runAuth(async () => {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value
      });

      if (error) throw error;
    });
  });

  signUpButton.addEventListener("click", () => {
    runAuth(async () => {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email.value.trim(),
        password: password.value
      });

      if (error) throw error;

      if (data.session) {
        showMessage("Account created. Welcome to Nova!");
      } else {
        showMessage(
          "Account created if accepted. Check your email for a confirmation link."
        );
      }
    });
  });

  resetButton.addEventListener("click", () => {
    runAuth(async () => {
      const address = email.value.trim();

      if (!address) {
        showMessage("Enter your email address first.");
        return;
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        address,
        { redirectTo: window.location.origin + window.location.pathname }
      );

      if (error) throw error;
      showMessage("If the account exists, a password reset email will be sent.");
    });
  });

  supabaseClient.auth.onAuthStateChange((event, session) => {
    panel.style.display = session ? "none" : "grid";

    if (session) {
      document.dispatchEvent(
        new CustomEvent("nova:authenticated", {
          detail: { user: session.user }
        })
      );
    }
  });

  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) showMessage(error.message);
    panel.style.display = data.session ? "none" : "grid";
  });

  // Expose a sign-out helper for Nova's interface.
  window.novaSignOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) showMessage(error.message);
  };
});
