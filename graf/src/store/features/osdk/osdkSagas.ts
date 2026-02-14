import { call, put, takeLatest } from "redux-saga/effects";
import { client } from "../../../client";
import { User, Users } from "@osdk/foundry.admin";
import { loadUser, setUser } from "./osdkSlice";


function* fetchUser(): any {
  try {
    const user: User = yield call(Users.getCurrent, client);
    if (!user) {
      console.error(`No User  found`);
      yield put(setUser(null));
      return;
    }
    console.log(
      `Loaded user ${user.username}`,
    );
    yield put(setUser(user));
  } catch (e) {
    console.error("Error fetching current user using OSDK:", e);
    yield put(setUser(null));
  }
}

export default function* osdkSagas(): Generator<any, void, unknown> {
  yield takeLatest(loadUser.type, fetchUser);
}
