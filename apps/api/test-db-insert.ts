
import { auth } from "./src/auth";

async function main() {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: "test@example.com",
        password: "password1234",
        name: "Test User"
      }
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
main();

