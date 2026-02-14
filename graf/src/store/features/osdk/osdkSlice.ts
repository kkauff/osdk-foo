import { User } from "@osdk/foundry.admin";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface OsdkState {
  user: User | null;
  loadingUser: boolean;
  userError: string | null;
}

const initialState: OsdkState = {
  user: null,
  loadingUser: false,
  userError: null,
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
  },
});

export const {
  loadUser,
  setUser,
  setUserError,
} = osdkSlice.actions;

export default osdkSlice.reducer;
