import React, {useState} from 'react';
import { MainToolbarVC, ActionList, openModal, DlgAbout, MainToolbar, Profile} from 'bi-internal/ui';
import {AuthenticationService} from 'bi-internal/core';
import {Header, AccountTool} from 'bi-internal/face';
import './DsShellHeader.scss';
import {useService, useServiceItself } from 'bi-internal/services';
import {skin, lang} from 'bi-internal/utils';


interface IDsShellHeaderProps {
  schema_name: string;
  dsTitle: string;
  dsDescription: string;
  dsUrl: string;
}

const DsShellHeader = React.memo(({schema_name, dsTitle, dsDescription, dsUrl}: IDsShellHeaderProps) => {
  const authenticationService = useServiceItself<AuthenticationService>(AuthenticationService);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const mainToolbar = useService<MainToolbarVC>(MainToolbarVC, schema_name);

  const onPressSignOut = async () => {
    await authenticationService.signOut();
    window.location.hash = '#';
  };

  const onPressAbout = () => {
    openModal(<DlgAbout/>);
  };

  const handleHide = () => setAccountMenuVisible(false);
  const toggleShow = () => setAccountMenuVisible(!accountMenuVisible);
  const handleClickAction = (key: string) => {
    if (key === 'logout') onPressSignOut();
    if (key === 'about') onPressAbout();
    handleHide();
  };
  const toggleDatasetDescription = () => {
    // TODO
  };

  const title = skin.datasetLogoTitle || authenticationService.getModel()?.username ;

  const accountMenu = (
    <ActionList onClick={(key) => handleClickAction(key)} className="AccountList">
      {/*<ActionList.Action key="profile" className="AccountList__Item">{lang('profile')}</ActionList.Action>*/}
      <ActionList.Action key="about" className="AccountList__Item">{lang('about')}</ActionList.Action>
      <ActionList.Action key="logout" className="AccountList__Item">{lang('log_out')}</ActionList.Action>
    </ActionList>
  );

  return (
    <Header className="DsShellHeader custom" id="jsHeaderClassForCalcBodyHeight">
      <header className="DsShellTitle" data-bind="visible: (koDatasetTitle() != null)">
        <h1 style={{fontWeight: 'normal'}} title={dsTitle}>{dsTitle}</h1>
      </header>

      <section className="DsShellHeader__Toolbar toolbar">
        {!mainToolbar.loading && !mainToolbar.error && <MainToolbar {...mainToolbar}/>}
      </section>
      <Profile />
    </Header>);
});
export default DsShellHeader;
