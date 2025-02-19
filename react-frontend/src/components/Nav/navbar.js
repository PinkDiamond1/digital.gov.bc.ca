import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { Row, Col } from 'react-flexbox-grid';

import {
  navBarResize,
  NavBanner,
  NavBarHeader,
  NavBarWrapper,
  NavImage,
  NavHamburgerButton,
  NavMain,
  NavTitle,
  SkipToMainContent,
} from '../StyleComponents/nav';
import {
  NavBarHeaderLink,
  NavBarLi,
  NavBarLink,
  NavBarLinkExternal,
  NavBarLinkFirst,
  NavBarUl,
} from '../StyleComponents/htmlTags';
import { NavBarContainer } from '../StyleComponents/pageContent';

const mobileImg = require('../../images/logo.svg').default;
const desktopImg = require('../../images/logo.png').default;

function NavBar() {
  const history = useHistory();
  const routeLocation = useLocation();
  const [activePage, setActivePage] = useState(routeLocation.pathname);
  const [openMenu, setOpenMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth > 800);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < navBarResize) {
        const nav = document.getElementById('navbar');
        if (nav?.style?.display) {
          nav.style.display = 'none';
        }
        setOpenMenu(false);
        setIsMobile(false);
      } else {
        const nav = document.getElementById('navbar');
        if (nav?.style?.display) {
          nav.style.display = 'block';
        }
        setOpenMenu(true);
        setIsMobile(true);
      }
    }

    window.addEventListener('resize', handleResize);

    history.listen((location) => {
      setActivePage(location.pathname);
      handleResize();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  }, [history]);

  const toggleMenu = () => {
    if (openMenu === false) {
      const nav = document.getElementById('navbar');
      nav.style.display = 'block';
      setOpenMenu(true);
    } else {
      const nav = document.getElementById('navbar');
      nav.style.display = 'none';
      setOpenMenu(false);
    }
  };

  let logoPath = isMobile ? mobileImg : desktopImg;

  return (
    <NavBarWrapper>
      {/* If a site banner is needed in the future, add the component here. (see CovidBanner code) */}
      <NavBarHeader>
        <NavBarContainer>
          <Row middle="xs">
            <Col xs={11}>
              <NavBanner>
                <NavBarHeaderLink
                  href="/"
                  alt="Go to the Digital.gov.bc.ca home page."
                >
                  <NavTitle>
                    <NavImage
                      src={logoPath}
                      alt="Go to the Digital.gov.bc.ca home page."
                    />{' '}
                    Digital Government
                  </NavTitle>
                </NavBarHeaderLink>
                <SkipToMainContent>Skip to main content</SkipToMainContent>
              </NavBanner>
            </Col>
            <Col xs={1}>
              <NavHamburgerButton onClick={toggleMenu} href=".">
                <FontAwesomeIcon icon={faBars} />
              </NavHamburgerButton>
            </Col>
          </Row>
        </NavBarContainer>
      </NavBarHeader>
      <NavMain>
        <NavBarContainer>
          <NavBarUl>
            <NavBarLi>
              <NavBarLinkFirst
                to="/communities"
                className={
                  activePage === '/communities' ? 'active' : 'notactive'
                }
              >
                Communities
              </NavBarLinkFirst>
            </NavBarLi>
            <NavBarLi>
              <NavBarLink
                to="/resources"
                className={activePage === '/resources' ? 'active' : 'notactive'}
              >
                Resources
              </NavBarLink>
            </NavBarLi>
            <NavBarLi>
              <NavBarLink
                to="/products-services"
                className={
                  activePage === '/products-services' ? 'active' : 'notactive'
                }
              >
                Products & Services
              </NavBarLink>
            </NavBarLi>
            <NavBarLi>
              <NavBarLink
                to="/case-studies"
                className={
                  activePage === '/case-studies' ? 'active' : 'notactive'
                }
              >
                Case Studies
              </NavBarLink>
            </NavBarLi>
            <NavBarLi>
              <NavBarLink
                to="/learning"
                className={activePage === '/learning' ? 'active' : 'notactive'}
              >
                Learning
              </NavBarLink>
            </NavBarLi>
            <NavBarLi>
              <NavBarLinkExternal href="/digital-trust">
                Digital Trust
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className="fa-xs"
                  pull="right"
                />
              </NavBarLinkExternal>
            </NavBarLi>
            <NavBarLi>
              <NavBarLinkExternal href="/marketplace">
                Marketplace
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                  className="fa-xs"
                  pull="right"
                />
              </NavBarLinkExternal>
            </NavBarLi>
          </NavBarUl>
        </NavBarContainer>
      </NavMain>
    </NavBarWrapper>
  );
}

export default NavBar;
