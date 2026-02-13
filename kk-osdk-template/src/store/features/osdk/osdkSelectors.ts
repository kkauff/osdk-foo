import type { RootState } from "../../store";

export const selectUser = (state: RootState) => state.osdk.user;
export const selectUserLoading = (state: RootState) => state.osdk.loadingUser;
export const selectUserError = (state: RootState) => state.osdk.userError;

export const selectAircraft = (state: RootState) => state.osdk.aircraft;
export const selectAircraftLoading = (state: RootState) =>
  state.osdk.loadingAircraft;
export const selectAircraftError = (state: RootState) =>
  state.osdk.aircraftError;