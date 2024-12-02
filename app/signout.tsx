import LoadingScreen from '@c/Loading';
import { signOutRequest } from '@s/authReducer';
import { withAuth } from '@u/hocs/withAuth';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

const SignoutScreen = () => {
  const dispatch = useDispatch();
  const signoutTriggered = useRef(false);
  useEffect(() => {
    if (signoutTriggered.current) return;

    setTimeout(() => {
      dispatch(signOutRequest());
    }, 500);
    signoutTriggered.current = true;
  })
  return (
    <LoadingScreen visible />
  )
}

export default withAuth(SignoutScreen);