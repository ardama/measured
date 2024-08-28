import appReducer from "@s/appReducer";
import userReducer from "@s/userReducer";

const rootReducer = {
    app: appReducer,
    user: userReducer,
}

export default rootReducer;