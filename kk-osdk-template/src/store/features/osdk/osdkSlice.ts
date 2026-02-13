import { User } from "@osdk/foundry.admin";
import { ExampleAircraft } from "@osdk-foo/sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface OsdkState {

  user: User | null;
  loadingUser: boolean;
  userError: string | null;

  aircraft: ExampleAircraft.OsdkInstance[];
  loadingAircraft: boolean;
  aircraftError: string | null;
}

const initialState: OsdkState = {
  user: null,
  loadingUser: false,
  userError: null,

  aircraft: [],
  loadingAircraft: false,
  aircraftError: null,
};

const osdkSlice = createSlice({
  name: "osdk",
  initialState,
  reducers: {
    loadUser: (state) => {
      state.loadingUser = true,
      state.user = null
    },
    setUser: (state, action: PayloadAction<User | null>) =>  {
      state.user = action.payload;
      state.loadingUser = false;
    },
    setUserError: (state, action: PayloadAction<string>) => {
      state.userError = action.payload;
      state.loadingUser = false;
    },

    loadAircraft: (state) => {
      state.loadingAircraft = true;
      state.aircraftError = null;
    },
    setAircraft: (state, action: PayloadAction<ExampleAircraft.OsdkInstance[]>) => {
      state.aircraft = action.payload as any;
      state.loadingAircraft = false;
    },
    setAircraftError: (state, action: PayloadAction<string>) => {
      state.aircraftError = action.payload;
      state.loadingAircraft = false;
    },
  },
});

export const {
  loadUser,
  setUser,
  setUserError,

  loadAircraft,
  setAircraft,
  setAircraftError,

} = osdkSlice.actions;

export default osdkSlice.reducer;
