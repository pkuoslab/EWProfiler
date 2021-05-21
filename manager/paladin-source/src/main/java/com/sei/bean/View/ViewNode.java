package com.sei.bean.View;

import com.alibaba.fastjson.annotation.JSONField;
import com.sei.util.SerializeUtil;
import com.sei.util.ViewUtil;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ViewNode implements Serializable, Comparable{
    private String viewTag;
    public int total_view;
    private String viewText;
    public String xpath;

    public boolean isList;

    @JSONField(serialize=false)
    private int nodeHash;
    public boolean clickable;

    private int nodeRelateHash;

    @JSONField(serialize=false)
    private int depth;

    private List<ViewNode> children;

    @JSONField(serialize=false)
    private ViewNode parent;


    @JSONField(serialize=false)
    private int viewNodeID;
    private int viewNodeIDRelative;

    public String resourceID;
    public String contentDesc;

    private int width;
    private int height;
    private int x;
    private int y;

    public ViewNode() {
        children = new LinkedList<ViewNode>();
        viewText = null;
    }

    public String getViewText() {
        return viewText;
    }
    public void setViewText(String viewText) {
        this.viewText = viewText;
    }

    public void setResourceID(String id){this.resourceID = id;}
    public String getResourceID(){return this.resourceID;}

    public int getNodeHash() {
        return nodeHash;
    }
    public void setNodeHash(int nodeHash) {
        this.nodeHash = nodeHash;
    }

    public int getNodeRelateHash() {
        return nodeRelateHash;
    }
    public void setNodeRelateHash(int nodeRelateHash) {
        this.nodeRelateHash = nodeRelateHash;
    }

    public int getViewNodeIDRelative() {
        return viewNodeIDRelative;
    }
    public void setViewNodeIDRelative(int viewNodeIDRelative) {
        this.viewNodeIDRelative = viewNodeIDRelative;
    }

    public String getViewTag() {
        return viewTag;
    }
    public void setViewTag(String viewTag) {
        this.viewTag = viewTag;
    }

    public int getDepth() {
        return depth;
    }
    public void setDepth(int depth) {
        this.depth = depth;
    }

    public List<ViewNode> getChildren() {
        return children;
    }
    public void setChildren(List<ViewNode> children) {
        this.children = children;
    }

    public ViewNode getParent() {
        return parent;
    }
    public void setParent(ViewNode parent) {
        this.parent = parent;
    }

    public int getViewNodeID() {
        return viewNodeID;
    }
    public void setViewNodeID(int viewNodeID) {
        this.viewNodeID = viewNodeID;
    }

    public int getWidth() {
        return width;
    }
    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }
    public void setHeight(int height) {
        this.height = height;
    }

    public int getX() {
        return x;
    }
    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }
    public void setY(int y) {
        this.y = y;
    }

    public String getContentDesc(){return this.contentDesc;}
    public void setContentDesc(String contentDesc){this.contentDesc=contentDesc;}

    public String calString(){
        return SerializeUtil.getAbbr(this.viewTag) + "-" + depth + "-" + viewText + "-" + this.x + "-" + this.y;
    }


    public String calStringWithoutPosition(){
        return  SerializeUtil.getAbbr(this.viewTag) + "-" + this.depth;
    }

    public ViewNode findRootNode(){
        ViewNode root = parent;
        while(root != null){
            if(root.parent != null)
                root = root.parent;
            else
                break;
        }
        return root;
    }

    @Override
    public int compareTo(Object another) {
        int res = getNodeRelateHash() - ((ViewNode) another).getNodeRelateHash();
        if (res != 0)
            return res;
        res = getY() - ((ViewNode) another).getY();
        if (res != 0)
            return res;
        return getX() - ((ViewNode) another).getX();
    }

    public String getPath(){
        ViewNode vn = this;
        List<String> list = new ArrayList<>();
        while (vn != null){
            if (vn.viewNodeIDRelative == 0)
                list.add(ViewUtil.getLast(vn.getViewTag()));
            else
                break;
            vn = vn.getParent();
        }
        String res = "";
        int len = list.size();
        if (len > 0){
            res = list.get(len-1);
            if (len > 1){
                for (int i = len-2; i >= 0; --i) {
                    res += ("/" + list.get(i));
                }
            }
        }
        if (vn == null)
            return res;
        else if (res == "")
            return ""+vn.getViewNodeIDRelative();
        return vn.getViewNodeIDRelative() + "#" + res;
    }

    public String getXpath(){
        if (this.xpath == null) {
            this.xpath = ViewUtil.generate_xpath(this);
        }
        return this.xpath;
    }
}
