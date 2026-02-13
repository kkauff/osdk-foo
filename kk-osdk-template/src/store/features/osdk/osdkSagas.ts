import { call, put, takeLatest } from "redux-saga/effects";
import { client } from "../../../client";
import { User, Users } from "@osdk/foundry.admin";
import { ExampleAircraft } from "@osdk-foo/sdk"
import { loadUser, loadAircraft, setAircraft, setUser } from "./osdkSlice";


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

function* fetchAircraft(): any {
  try {
    const result = yield call(
      [client(ExampleAircraft), "fetchPage"],
    );
    const aircraft: ExampleAircraft.OsdkInstance[] = result.data;
    if (!aircraft || aircraft.length === 0) {
      console.error(`No ExampleAircraft  found`);
      yield put(setAircraft([]));
      return;
    }
    console.log(
      `Loaded ${aircraft.length} aircraft`,
    );
    yield put(setAircraft(aircraft));
  } catch (e) {
    console.error("Error fetching ExampleAircraft using OSDK:", e);
    yield put(setAircraft([]));
  }
  
}

export default function* osdkSagas(): Generator<any, void, unknown> {

  yield takeLatest(loadUser.type, fetchUser);

  yield takeLatest(loadAircraft.type, fetchAircraft);
}
