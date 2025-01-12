import appReducer from "@s/appReducer";
import authReducer from '@s/authReducer';
import dataReducer from "@s/dataReducer";

const rootReducer = {
  app: appReducer,
  auth: authReducer,
  data: dataReducer,
}

export default rootReducer;